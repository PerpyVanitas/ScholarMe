"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface VerificationRequest {
  id: string; // The specialization join record ID
  tutor_id: string;
  specialization_id: string;
  verification_status: "pending" | "approved" | "rejected";
  verification_document_url: string;
  tutor: {
    first_name: string;
    last_name: string;
    email: string;
  };
  specialization: {
    name: string;
  };
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("roles(name)")
      .eq("id", user.id)
      .single();

    const isAdmin = Array.isArray(profile?.roles)
      ? profile.roles.some(
          (r: { name: string }) =>
            r.name === "administrator" ||
            r.name === "president" ||
            r.name === "super_admin",
        )
      : ["administrator", "president", "super_admin"].includes(
          (profile?.roles as { name: string } | undefined)?.name || "",
        );

    if (error || !isAdmin) {
      router.push("/dashboard/home");
      return;
    }
    await fetchRequests();
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutor_specializations")
      .select(
        `
        tutor_id,
        specialization_id,
        verification_status,
        verification_document_url,
        submitted_at,
        tutors!inner(
          profiles(first_name, last_name, email)
        ),
        specializations!inner(name)
      `,
      )
      .eq("verification_status", "pending")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch verifications:", error);
      toast.error("Failed to load verification requests");
      setRequests([]);
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: VerificationRequest[] = (data as unknown[]).map((row) => ({
      // @ts-expect-error: Strict unknown type check
      id: `${row.tutor_id}:${row.specialization_id}`,
      // @ts-expect-error: Strict unknown type check
      tutor_id: row.tutor_id,
      // @ts-expect-error: Strict unknown type check
      specialization_id: row.specialization_id,
      // @ts-expect-error: Strict unknown type check
      verification_status: row.verification_status,
      // @ts-expect-error: Strict unknown type check
      verification_document_url: row.verification_document_url,
      // @ts-expect-error: Strict unknown type check
      submitted_at: row.submitted_at,
      // @ts-expect-error: Strict unknown type check
      tutor: row.tutors?.profiles ?? {
        first_name: "",
        last_name: "",
        email: "",
      },
      // @ts-expect-error: Strict unknown type check
      specialization: row.specializations ?? { name: "" },
    }));

    setRequests(mapped);
    setLoading(false);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const req = requests.find((r) => r.id === id);
      if (!req) return;

      const { error } = await supabase
        .from("tutor_specializations")
        .update({ verification_status: status })
        .eq("tutor_id", req.tutor_id)
        .eq("specialization_id", req.specialization_id);

      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(
        status === "approved"
          ? "Verification approved"
          : "Verification rejected",
      );
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Subject Mastery Verifications
        </h1>
        <p className="text-muted-foreground">
          Review and approve tutor subject mastery transcripts and certificates.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mb-4 text-primary/40" />
            <p>All caught up! No pending verification requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {req.tutor.first_name} {req.tutor.last_name}
                    </h3>
                    <Badge variant="outline">{req.tutor.email}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {req.specialization.name}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-500"
                      onClick={async () => {
                        const docUrl = req.verification_document_url;
                        if (!docUrl) {
                          toast.error("No document uploaded for this request.");
                          return;
                        }
                        // If it's already a full URL, open directly
                        if (
                          docUrl.startsWith("http://") ||
                          docUrl.startsWith("https://")
                        ) {
                          window.open(docUrl, "_blank", "noopener,noreferrer");
                          return;
                        }
                        // Otherwise generate a signed URL from Supabase storage
                        try {
                          const { data, error } = await supabase.storage
                            .from("resources")
                            .createSignedUrl(docUrl, 60);
                          if (error || !data?.signedUrl) throw error;
                          window.open(
                            data.signedUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        } catch {
                          toast.error(
                            "Could not open document. The file may have been deleted.",
                          );
                        }
                      }}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      View Document
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                    }
                    title="Approve Mastery Verification?"
                    description="This will mark the tutor as a verified expert in this subject."
                    confirmLabel="Approve"
                    onConfirm={() => handleUpdateStatus(req.id, "approved")}
                  />
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    }
                    title="Reject Mastery Verification?"
                    description="This will deny the verification. The tutor can upload a new document later."
                    confirmLabel="Reject"
                    onConfirm={() => handleUpdateStatus(req.id, "rejected")}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
