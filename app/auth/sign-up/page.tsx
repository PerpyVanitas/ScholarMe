/** Sign-up page -- two-column industry-standard layout with 3-step wizard. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StepProgress } from "@/components/ui/step-progress";
import {
  GraduationCap,
  Loader2,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { TosLink, PrivacyLink } from "@/components/legal-modals";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignUpBrandingPanel } from "@/features/auth/components/sign-up-branding-panel";
import { SignUpSuccessScreen } from "@/features/auth/components/sign-up-success-screen";
import {
  SignUpStep1,
  SignUpStep2,
  SignUpStep3,
  type SignUpFormData,
} from "@/features/auth/components/sign-up-steps";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("phone number")) return msg;
  if (m.includes("already registered") || m.includes("already exists"))
    return "An account with this email already exists. Please sign in instead.";
  if (m.includes("invalid email")) return "Please enter a valid email address.";
  if (
    m.includes("password") &&
    (m.includes("weak") || m.includes("short") || m.includes("least"))
  )
    return "Password must be at least 8 characters long.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please wait a moment before trying again.";
  return msg || "An unexpected error occurred. Please try again.";
}

import { AUTH_VALIDATORS as VALIDATORS } from "@/features/auth/utils/validators";

const STEP_LABELS = ["Account", "Profile", "Review"];

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1, 2, 3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"learner" | "tutor">(
    "learner",
  );
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    password: "",
    confirmPassword: "",
    academic_year_joined: "2024-2025",
    degree_program: "",
    year_level: "1",
    esas_scholar: false,
    terms_accepted: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateField(name: keyof typeof VALIDATORS, value: string) {
    const err = VALIDATORS[name]?.(value) ?? "";
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    errs.email = VALIDATORS.email?.(formData.email) ?? "";
    errs.password = VALIDATORS.password?.(formData.password) ?? "";
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    } else {
      errs.confirmPassword = "";
    }
    setFieldErrors((prev) => ({ ...prev, ...errs }));
    return Object.values(errs).every((e) => !e);
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    errs.first_name = VALIDATORS.first_name?.(formData.first_name) ?? "";
    errs.last_name = VALIDATORS.last_name?.(formData.last_name) ?? "";
    errs.phone_number = VALIDATORS.phone_number?.(formData.phone_number) ?? "";
    errs.date_of_birth =
      VALIDATORS.date_of_birth?.(formData.date_of_birth) ?? "";
    if (selectedRole === "learner") {
      errs.degree_program =
        VALIDATORS.degree_program?.(formData.degree_program) ?? "";
    }
    setFieldErrors((prev) => ({ ...prev, ...errs }));
    return Object.values(errs).every((e) => !e);
  }

  function validateAll(): boolean {
    const errors: Record<string, string> = {};
    (Object.keys(VALIDATORS) as Array<keyof typeof VALIDATORS>).forEach((k) => {
      const val = formData[k as keyof typeof formData] as string;
      errors[k] = VALIDATORS[k](val);
    });
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.values(errors).every((e) => !e);
  }

  function handleNext() {
    setError("");
    if (step === 1) {
      if (!validateStep1()) {
        setError("Please fix the errors above before continuing.");
        toast.error("Please fix the highlighted fields.");
        return;
      }
    }
    if (step === 2) {
      if (!validateStep2()) {
        setError("Please fill in all required fields.");
        toast.error("Please fix the highlighted fields.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!formData.terms_accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      toast.error("Please accept the terms to continue.");
      return;
    }

    if (!validateAll()) {
      setError("Please fix the errors above before continuing.");
      toast.error("Some fields are invalid — please go back and fix them.");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.set("email", formData.email);
    fd.set("password", formData.password);
    fd.set("first_name", formData.first_name);
    fd.set("last_name", formData.last_name);
    fd.set("phone_number", formData.phone_number);
    fd.set("date_of_birth", formData.date_of_birth);
    fd.set("role", selectedRole);
    fd.set("academic_year_joined", formData.academic_year_joined);
    fd.set("degree_program", formData.degree_program);
    fd.set("year_level", formData.year_level.toString());
    if (selectedRole === "tutor") {
      fd.set("esas_scholar", formData.esas_scholar.toString());
    }

    const result = await signUp(fd);
    if (result?.error) {
      const msg = mapAuthError(result.error);
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (result?.emailConfirmRequired) {
      setShowEmailSent(true);
      setLoading(false);
      toast.success("Account created! Please check your email to verify.");
    } else {
      toast.success("Account created! Setting up your profile...");
      window.location.href = "/auth/setup-profile";
    }
  }

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][
    passwordStrength
  ];
  const strengthColor = [
    "",
    "bg-orange-500",
    "bg-amber-400",
    "bg-primary",
    "bg-emerald-500",
  ][passwordStrength];
  const strengthTextColor = [
    "",
    "text-orange-500",
    "text-amber-400",
    "text-primary",
    "text-emerald-500",
  ][passwordStrength];

  return (
    <div className="flex min-h-screen">
      <SignUpBrandingPanel />

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background px-6 py-10">
        {/* Mobile logo */}
        <div className="mb-6 flex lg:hidden items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            ScholarMe
          </span>
        </div>

        <div className="w-full max-w-md">
          {showEmailSent ? (
            <SignUpSuccessScreen email={formData.email} />
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Create an account
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Already have one?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Step progress indicator */}
              <StepProgress
                steps={3}
                current={step}
                labels={STEP_LABELS}
                className="mb-8"
              />

              <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                {/* ── Step 1: Account ── */}
                {step === 1 && (
                  <SignUpStep1
                    formData={formData}
                    setFormData={setFormData}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                    validateField={validateField}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    passwordMatch={passwordMatch}
                    setPasswordMatch={setPasswordMatch}
                    passwordStrength={passwordStrength}
                    strengthLabel={strengthLabel}
                    strengthColor={strengthColor}
                    strengthTextColor={strengthTextColor}
                  />
                )}

                {/* ── Step 2: Profile / Identity ── */}
                {step === 2 && (
                  <SignUpStep2
                    formData={formData}
                    setFormData={setFormData}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                    validateField={validateField}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    passwordMatch={passwordMatch}
                    setPasswordMatch={setPasswordMatch}
                  />
                )}

                {/* ── Step 3: Review & Submit ── */}
                {step === 3 && (
                  <SignUpStep3
                    formData={formData}
                    setFormData={setFormData}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                    validateField={validateField}
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    passwordMatch={passwordMatch}
                    setPasswordMatch={setPasswordMatch}
                  />
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setError("");
                        setStep((s) => s - 1);
                      }}
                      className="flex-1 gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className={cn(
                        "h-11 text-sm font-semibold gap-2",
                        step === 1 ? "w-full" : "flex-1",
                      )}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 h-11 text-sm font-semibold"
                      disabled={loading || !formData.terms_accepted}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
