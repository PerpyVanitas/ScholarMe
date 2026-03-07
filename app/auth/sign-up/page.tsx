/** Sign-up page -- creates a new learner account via Supabase Auth. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mapSupabaseErrorToCode, formatErrorForDisplay } from "@/lib/error-codes";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"learner" | "tutor">("learner");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    password: "",
    confirmPassword: "",
    terms_accepted: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(true);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    // Validate terms accepted
    if (!formData.terms_accepted) {
      setError("You must accept the terms and conditions");
      toast.error("You must accept the terms and conditions");
      return;
    }

    // Validate minimum age (13)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        if (age < 13) {
          setError("You must be at least 13 years old to create an account");
          toast.error("You must be at least 13 years old");
          return;
        }
      }
    }

    setLoading(true);
    const submitFormData = new FormData();
    submitFormData.set("email", formData.email);
    submitFormData.set("password", formData.password);
    submitFormData.set("full_name", formData.full_name);
    submitFormData.set("phone_number", formData.phone_number);
    submitFormData.set("date_of_birth", formData.date_of_birth);
    submitFormData.set("role", selectedRole);

    const result = await signUp(submitFormData);
    if (result?.error) {
      const mappedError = mapSupabaseErrorToCode(result.error);
      const displayError = formatErrorForDisplay(mappedError);
      setError(displayError);
      toast.error(displayError);
      setLoading(false);
      return;
    }
    toast.success("Account created successfully!");
    window.location.href = "/auth/setup-profile";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ScholarMe</h1>
          </Link>
          <p className="text-sm text-muted-foreground text-balance">
            Create your tutoring account
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign Up</CardTitle>
            <CardDescription>
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <input type="hidden" name="role" value={selectedRole} />

              <div className="flex flex-col gap-2">
                <Label>I want to join as</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("learner")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      selectedRole === "learner"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <BookOpen className={cn("h-6 w-6", selectedRole === "learner" ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", selectedRole === "learner" ? "text-primary" : "text-foreground")}>Learner</span>
                    <span className="text-[11px] leading-tight text-muted-foreground text-center">Browse tutors and book sessions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("tutor")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      selectedRole === "tutor"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <Users className={cn("h-6 w-6", selectedRole === "tutor" ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", selectedRole === "tutor" ? "text-primary" : "text-foreground")}>Tutor</span>
                    <span className="text-[11px] leading-tight text-muted-foreground text-center">Teach others and share resources</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Must be at least 13 years old</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 8 characters)"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={!passwordMatch ? "border-destructive" : ""}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setPasswordMatch(e.target.value === formData.password);
                  }}
                  className={!passwordMatch ? "border-destructive" : ""}
                />
                {!passwordMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                className="justify-start text-xs"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"} passwords
              </Button>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  className="mt-1 rounded border-border"
                />
                <Label htmlFor="terms" className="text-xs leading-relaxed font-normal cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary underline hover:no-underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary underline hover:no-underline">
                    Privacy Policy
                  </Link>
                  *
                </Label>
              </div>

              <ErrorAlert error={error} />
              <Button type="submit" className="w-full" disabled={loading || !formData.terms_accepted}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
