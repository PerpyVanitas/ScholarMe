"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  AUDIT_ROLES,
  FINANCE_REVIEW_ROLES,
  FINANCE_SUBMIT_ROLES,
  PRESIDENT_APPROVAL_ROLES,
} from "@/lib/utils/roles";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function notifyStatusChange(email: string, title: string, status: string) {
  if (!resend) {
    console.log(`[Notification Mock] Email to ${email}: ${title} status changed to ${status}`);
    return;
  }
  try {
    await resend.emails.send({
      from: "finance@scholarme.app",
      to: email,
      subject: `Finance Request Update: ${status.replace("_", " ").toUpperCase()}`,
      html: `<p>Your finance request <b>${title}</b> has been updated to <b>${status.replace("_", " ").toUpperCase()}</b>.</p>`,
    });
  } catch (error) {
    console.error("[finance] Failed to send email notification", error);
  }
}

async function checkRole(
  supabase: SupabaseClient,
  userId: string,
  allowedRoles: readonly string[],
) {
  const { data } = await supabase.rpc("has_role", {
    user_id: userId,
    allowed_roles: [...allowedRoles],
  });
  return data === true;
}

async function checkCanSubmitFinance(supabase: SupabaseClient, userId: string) {
  return checkRole(supabase, userId, FINANCE_SUBMIT_ROLES);
}

async function checkCanReviewFinance(supabase: SupabaseClient, userId: string) {
  return checkRole(supabase, userId, FINANCE_REVIEW_ROLES);
}

async function checkCanApproveFinance(
  supabase: SupabaseClient,
  userId: string,
) {
  return checkRole(supabase, userId, PRESIDENT_APPROVAL_ROLES);
}

async function checkCanAuditFinance(supabase: SupabaseClient, userId: string) {
  return checkRole(supabase, userId, AUDIT_ROLES);
}

/**
 * Checks if a user has any late liquidations
 */
export async function hasLateLiquidations(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_liquidations")
    .select("id")
    .eq("submitted_by", userId)
    .eq("is_late", true)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.length || 0) > 0;
}

/**
 * Creates a budget request. Blocked if the user has late liquidations.
 */
export async function createBudgetRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canSubmit = await checkCanSubmitFinance(supabase, user.id);
  if (!canSubmit) throw new Error("Unauthorized to submit budget requests");

  const isLate = await hasLateLiquidations(user.id);
  if (isLate) {
    throw new Error(
      "You have late liquidations. Please resolve them before submitting new budget requests.",
    );
  }

  const activity_title = formData.get("activity_title") as string;
  const objectives = formData.get("objectives") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const breakdownStr = formData.get("breakdown") as string;
  const attachment = formData.get("attachment") as File | null;
  const vendor_id = formData.get("vendor_id") as string | null;
  let attachmentUrl = null;

  if (attachment && attachment.size > 0) {
    const ext = attachment.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `${user.id}/${Date.now()}-budget.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("finance_attachments")
      .upload(filePath, attachment, { contentType: attachment.type });
    if (uploadError) throw new Error(uploadError.message);
    attachmentUrl = filePath;
  }

  let breakdown = [];
  try {
    breakdown = JSON.parse(breakdownStr);
  } catch (e) {
    console.error("[finance] Failed to parse breakdown:", e);
  }

  const actionType = formData.get("action_type") as string;
  const status = actionType === "draft" ? "draft" : "pending";

  const { error } = await supabase.from("finance_budget_requests").insert({
    activity_title,
    objectives,
    amount,
    breakdown,
    attachment_url: attachmentUrl,
    vendor_id: vendor_id || null,
    submitted_by: user.id,
    status,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Updates a budget request status (requires finance_manager)
 */
export async function updateBudgetRequestStatus(
  requestId: string,
  status: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing, error: fetchError } = await supabase
    .from("finance_budget_requests")
    .select("status, amount, activity_title, profiles(email)")
    .eq("id", requestId)
    .single();
  if (fetchError || !existing) {
    throw new Error(fetchError?.message || "Budget request not found");
  }

  const currentStatus = existing.status as string;
  const amount = Number(existing.amount);
  const canReview = await checkCanReviewFinance(supabase, user.id);
  const canApprove = await checkCanApproveFinance(supabase, user.id);
  
  // Fast-track: if <= 5000, Finance Review can jump straight to Released.
  let allowed = false;
  if (amount <= 5000) {
    allowed =
      (currentStatus === "pending" && ["released", "rejected"].includes(status) && canReview) ||
      (currentStatus === "pending" && status === "finance_review" && canReview);
  } else {
    allowed =
      (currentStatus === "pending" && ["finance_review", "rejected"].includes(status) && canReview) ||
      (currentStatus === "finance_review" && ["president_approved", "rejected"].includes(status) && canApprove) ||
      (currentStatus === "president_approved" && status === "released" && canReview);
  }

  if (!allowed) {
    throw new Error("Unauthorized finance status transition");
  }

  const { error } = await supabase
    .from("finance_budget_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);
  
  const profileData = existing.profiles as any;
  const userEmail = profileData ? (Array.isArray(profileData) ? profileData[0]?.email : profileData.email) : null;
  
  if (userEmail) {
    await notifyStatusChange(userEmail, existing.activity_title, status);
  }

  revalidatePath("/dashboard/finance");
}

/**
 * Submits a drafted budget request for review (submitter only)
 */
export async function submitBudgetRequestForReview(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canSubmit = await checkCanSubmitFinance(supabase, user.id);
  if (!canSubmit) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_budget_requests")
    .update({ status: "pending" })
    .eq("id", requestId)
    .eq("status", "draft")
    .eq("submitted_by", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Submits a petty cash request. Flags if requested > 300 in last 24h.
 */
export async function createPettyCash(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canSubmit = await checkCanSubmitFinance(supabase, user.id);
  if (!canSubmit) throw new Error("Unauthorized to submit petty cash");

  const amount = parseFloat(formData.get("amount") as string);
  let justification = formData.get("justification") as string;
  const attachment = formData.get("attachment") as File | null;
  const vendor_id = formData.get("vendor_id") as string | null;
  let attachmentUrl = null;

  if (attachment && attachment.size > 0) {
    const ext = attachment.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `${user.id}/${Date.now()}-pettycash.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("finance_attachments")
      .upload(filePath, attachment, { contentType: attachment.type });
    if (uploadError) throw new Error(uploadError.message);
    attachmentUrl = filePath;
  }

  // Anti-splitting check
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data: recentRequests } = await supabase
    .from("finance_petty_cash")
    .select("amount")
    .eq("submitted_by", user.id)
    .gte("created_at", yesterday.toISOString());

  const recentTotal =
    recentRequests?.reduce((sum, req) => sum + Number(req.amount), 0) || 0;

  const actionType = formData.get("action_type") as string;
  const initialStatus = actionType === "draft" ? "draft" : "pending";
  const status = recentTotal + amount > 300 ? initialStatus : initialStatus; // Logic to flag could be modified if needed, but we keep the status as is, justification already flagged.

  if (recentTotal + amount > 300) {
    // Flag for auditor by prepending to justification
    justification = `[FLAGGED: >300 within 24h] ` + justification;
  }

  const { error } = await supabase.from("finance_petty_cash").insert({
    amount,
    justification,
    attachment_url: attachmentUrl,
    vendor_id: vendor_id || null,
    submitted_by: user.id,
    status,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function approvePettyCash(
  id: string,
  status: "approved" | "rejected",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canReview = await checkCanReviewFinance(supabase, user.id);
  if (!canReview) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_petty_cash")
    .update({
      status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Submits a drafted petty cash request for review (submitter only)
 */
export async function submitPettyCashForReview(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canSubmit = await checkCanSubmitFinance(supabase, user.id);
  if (!canSubmit) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_petty_cash")
    .update({ status: "pending" })
    .eq("id", id)
    .eq("status", "draft")
    .eq("submitted_by", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function submitLiquidation(formData: FormData) {
  const requestId = formData.get("request_id") as string;
  const returnedAmount = parseFloat(formData.get("returned_amount") as string) || 0;

  // Handle multiple file uploads for receipts and proofs
  const receipts = formData.getAll("receipts") as File[];
  const proofs = formData.getAll("proofs") as File[];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canSubmit = await checkCanSubmitFinance(supabase, user.id);
  if (!canSubmit) throw new Error("Unauthorized to submit liquidations");

  // Check if it's late (e.g. > 7 days since request created or released)
  const { data: reqData } = await supabase
    .from("finance_budget_requests")
    .select("created_at")
    .eq("id", requestId)
    .single();

  let isLate = false;
  if (reqData) {
    const createdDate = new Date(reqData.created_at);
    const now = new Date();
    const diffDays = Math.ceil(
      Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 7) {
      isLate = true;
    }
  }

  const receiptUrls: string[] = [];
  const proofUrls: string[] = [];

  for (const file of receipts) {
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${Date.now()}-receipt-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      await supabase.storage
        .from("finance_attachments")
        .upload(filePath, file, { contentType: file.type });
      receiptUrls.push(filePath);
    }
  }

  for (const file of proofs) {
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${Date.now()}-proof-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      await supabase.storage
        .from("finance_attachments")
        .upload(filePath, file, { contentType: file.type });
      proofUrls.push(filePath);
    }
  }

  const { error } = await supabase.from("finance_liquidations").insert({
    request_id: requestId,
    receipt_urls: receiptUrls,
    proof_of_payment_urls: proofUrls,
    submitted_by: user.id,
    is_late: isLate,
    returned_amount: returnedAmount,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Creates or updates a SCARDS version
 */
export async function saveScards(formData: FormData) {
  const eventId = formData.get("event_id") as string;
  const receipts = parseFloat(formData.get("receipts_total") as string) || 0;
  const disbursements =
    parseFloat(formData.get("disbursements_total") as string) || 0;
  const attachment = formData.get("attachment") as File | null;
  let attachmentUrl = null;
  const status = "draft";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (attachment && attachment.size > 0) {
    const ext = attachment.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `${user.id}/${Date.now()}-scards.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("finance_attachments")
      .upload(filePath, attachment, { contentType: attachment.type });
    if (uploadError) throw new Error(uploadError.message);
    attachmentUrl = filePath;
  }

  const canReview = await checkCanReviewFinance(supabase, user.id);
  if (!canReview) throw new Error("Unauthorized to prepare SCARDS");

  const balance = receipts - disbursements;

  // Check existing version
  const { data: existing } = await supabase
    .from("finance_scards")
    .select("version")
    .eq("event_id", eventId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  let newVersion = 1;
  if (existing) {
    newVersion = existing.version + 1;
  }

  const { error } = await supabase.from("finance_scards").insert({
    event_id: eventId,
    receipts_total: receipts,
    disbursements_total: disbursements,
    balance,
    status,
    attachment_url: attachmentUrl,
    version: newVersion,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function getSecureAttachmentUrl(filePath: string) {
  if (!filePath) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase.storage
    .from("finance_attachments")
    .createSignedUrl(filePath, 3600);

  if (error || !data) throw new Error("Failed to generate secure URL");
  return data.signedUrl;
}

/**
 * Submit a SCARDS draft for review (changes status from 'draft' to 'submitted')
 */
export async function submitScardsForReview(scardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canReview = await checkCanReviewFinance(supabase, user.id);
  if (!canReview) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_scards")
    .update({ status: "auditor_review" })
    .eq("id", scardId)
    .eq("status", "draft"); // Only draft can be submitted

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Update a draft SCARDS report before submission
 */
export async function updateScardsReport(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canReview = await checkCanReviewFinance(supabase, user.id);
  if (!canReview) throw new Error("Unauthorized to update SCARDS");

  const scardId = formData.get("scard_id") as string;
  const receipts = parseFloat(formData.get("receipts_total") as string) || 0;
  const disbursements =
    parseFloat(formData.get("disbursements_total") as string) || 0;
  const attachment = formData.get("attachment") as File | null;
  const balance = receipts - disbursements;

  let attachmentUrl: string | null = null;
  if (attachment && attachment.size > 0) {
    const ext = attachment.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `${user.id}/${Date.now()}-scards-edit.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("finance_attachments")
      .upload(filePath, attachment, { contentType: attachment.type });
    if (uploadError) throw new Error(uploadError.message);
    attachmentUrl = filePath;
  }

  const updateData: Record<string, unknown> = {
    receipts_total: receipts,
    disbursements_total: disbursements,
    balance,
  };
  if (attachmentUrl) updateData.attachment_url = attachmentUrl;

  const { error } = await supabase
    .from("finance_scards")
    .update(updateData)
    .eq("id", scardId)
    .eq("status", "draft"); // Can only edit drafts

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function cosignScards(scardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const canAudit = await checkCanAuditFinance(supabase, user.id);
  if (!canAudit) throw new Error("Unauthorized to co-sign");

  const { error } = await supabase
    .from("finance_scards")
    .update({
      status: "cosigned",
      cosigned_by: user.id,
      cosigned_at: new Date().toISOString(),
    })
    .eq("id", scardId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}
