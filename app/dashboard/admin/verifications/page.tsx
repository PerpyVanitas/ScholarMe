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
import { validateAdmin } from "@/lib/auth-utils";
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
    const { isAdmin } = await validateAdmin();
    if (!isAdmin) {
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
        tutors!inner(
          profiles(first_name, last_name, email)
        ),
        specializations!inner(name)
      `,
      )
      .eq("verification_status", "pending")
      .order("tutor_id", { ascending: true });

    if (error) {
      console.error("Failed to fetch verifications:", error);
      toast.error("Failed to load verification requests");
      setRequests([]);
      setLoading(false);
      return;
    }

    const mapped: VerificationRequest[] = (data as any[]).map((row) => ({
      id: `${row.tutor_id}:${row.specialization_id}`,
      tutor_id: row.tutor_id,
      specialization_id: row.specialization_id,
      verification_status: row.verification_status,
      verification_document_url: row.verification_document_url,
      tutor: row.tutors?.profiles ?? {
        first_name: "",
        last_name: "",
        email: "",
      },
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
                      asChild
                    >
                      <a
                        href={req.verification_document_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        View Document
                      </a>
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
