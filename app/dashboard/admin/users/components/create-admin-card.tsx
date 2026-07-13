"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateAdminCard() {
  const [creating, setCreating] = useState(false);
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [adminFormError, setAdminFormError] = useState("");

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminFormError("");
    if (adminForm.password !== adminForm.confirmPassword)
      return setAdminFormError("Passwords do not match.");
    if (adminForm.password.length < 8)
      return setAdminFormError("Password must be at least 8 characters.");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error?.message || "Failed to create admin");

      toast.success("Administrator created successfully.");
      setAdminForm({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setAdminFormError(e.message || "An error occurred");
      toast.error(e.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Administrator</CardTitle>
        <CardDescription>
          Create a new Super Admin account. They will have full access to the
          system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleCreateAdmin}
          className="flex flex-col gap-4 max-w-sm"
        >
          <Input
            required
            placeholder="Full Name"
            value={adminForm.full_name}
            onChange={(e) =>
              setAdminForm({ ...adminForm, full_name: e.target.value })
            }
          />
          <Input
            required
            type="email"
            placeholder="Email"
            value={adminForm.email}
            onChange={(e) =>
              setAdminForm({ ...adminForm, email: e.target.value })
            }
          />
          <Input
            required
            type="password"
            placeholder="Password"
            value={adminForm.password}
            onChange={(e) =>
              setAdminForm({ ...adminForm, password: e.target.value })
            }
          />
          <Input
            required
            type="password"
            placeholder="Confirm Password"
            value={adminForm.confirmPassword}
            onChange={(e) =>
              setAdminForm({ ...adminForm, confirmPassword: e.target.value })
            }
          />
          {adminFormError && (
            <p className="text-sm text-destructive">{adminFormError}</p>
          )}
          <Button type="submit" disabled={creating} className="w-fit">
            {creating ? "Creating..." : "Create Admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
