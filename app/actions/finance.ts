"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Checks if the user is a finance manager or administrator
 */
async function checkFinanceManager(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", {
    user_id: userId,
    allowed_roles: ["finance_manager", "administrator"],
  });
  return data === true;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const isLate = await hasLateLiquidations(user.id);
  if (isLate) {
    throw new Error("You have late liquidations. Please resolve them before submitting new budget requests.");
  }

  const activity_title = formData.get("activity_title") as string;
  const objectives = formData.get("objectives") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const breakdownStr = formData.get("breakdown") as string;
  
  let breakdown = [];
  try {
    breakdown = JSON.parse(breakdownStr);
  } catch (e) {
    // default
  }

  const { error } = await supabase.from("finance_budget_requests").insert({
    activity_title,
    objectives,
    amount,
    breakdown,
    submitted_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Updates a budget request status (requires finance_manager)
 */
export async function updateBudgetRequestStatus(requestId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const isManager = await checkFinanceManager(supabase, user.id);
  if (!isManager) throw new Error("Unauthorized to approve requests");

  const { error } = await supabase
    .from("finance_budget_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Submits a petty cash request. Flags if requested > 300 in last 24h.
 */
export async function createPettyCash(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amount = parseFloat(formData.get("amount") as string);
  let justification = formData.get("justification") as string;

  // Anti-splitting check
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: recentRequests } = await supabase
    .from("finance_petty_cash")
    .select("amount")
    .eq("submitted_by", user.id)
    .gte("created_at", yesterday.toISOString());

  const recentTotal = recentRequests?.reduce((sum, req) => sum + Number(req.amount), 0) || 0;
  
  let status = "pending";
  if (recentTotal + amount > 300) {
    // Flag for auditor by prepending to justification
    justification = `[FLAGGED: >300 within 24h] ` + justification;
  }

  const { error } = await supabase.from("finance_petty_cash").insert({
    amount,
    justification,
    submitted_by: user.id,
    status
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function approvePettyCash(id: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const isManager = await checkFinanceManager(supabase, user.id);
  if (!isManager) throw new Error("Unauthorized");

  const { error } = await supabase.from("finance_petty_cash").update({
    status,
    approved_by: user.id
  }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function submitLiquidation(requestId: string, receiptUrls: string[], proofUrls: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
    const diffDays = Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      isLate = true;
    }
  }

  const { error } = await supabase.from("finance_liquidations").insert({
    request_id: requestId,
    receipt_urls: receiptUrls,
    proof_of_payment_urls: proofUrls,
    submitted_by: user.id,
    is_late: isLate
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

/**
 * Creates or updates a SCARDS version
 */
export async function saveScards(eventId: string, receipts: number, disbursements: number, status: string = 'draft') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
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
    version: newVersion
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}

export async function cosignScards(scardId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const isManager = await checkFinanceManager(supabase, user.id);
  if (!isManager) throw new Error("Unauthorized to co-sign");

  const { error } = await supabase.from("finance_scards").update({
    status: 'cosigned',
    cosigned_by: user.id,
    cosigned_at: new Date().toISOString()
  }).eq("id", scardId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/finance");
}
