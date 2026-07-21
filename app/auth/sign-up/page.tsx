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
  const [formData, setFormData] = useState({
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
                  <>
                    {/* Role selector */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">
                        I want to join as
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["learner", "tutor"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border-2 p-3.5 text-left transition-all",
                              selectedRole === r
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40 bg-card",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                                selectedRole === r
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {r === "learner" ? (
                                <BookOpen className="h-4 w-4" />
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  selectedRole === r
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {r === "learner" ? "Learner" : "Tutor"}
                              </p>
                              <p className="text-[11px] text-muted-foreground leading-snug">
                                {r === "learner"
                                  ? "Find & book tutors"
                                  : "Teach & earn"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email">
                        Email Address{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        onBlur={(e) => validateField("email", e.target.value)}
                        className={cn(
                          fieldErrors.email &&
                            "border-destructive focus-visible:ring-destructive",
                        )}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            validateField("password", e.target.value)
                          }
                          className={cn(
                            "pr-10",
                            fieldErrors.password &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-xs text-destructive mt-1">
                          {fieldErrors.password}
                        </p>
                      )}
                      <div
                        className={cn(
                          "mt-1 transition-all",
                          formData.password
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                                  formData.password && i <= passwordStrength
                                    ? strengthColor
                                    : "bg-border",
                                )}
                              />
                            ))}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium w-10 text-right transition-colors",
                              strengthTextColor,
                            )}
                          >
                            {formData.password ? strengthLabel : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Use 8+ characters with uppercase, numbers, and symbols
                          for a strong password.
                        </p>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="confirmPassword">
                        Confirm Password{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat your password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, confirmPassword: val });
                            const match =
                              val === formData.password || val === "";
                            setPasswordMatch(match);
                            if (!match)
                              setFieldErrors((prev) => ({
                                ...prev,
                                confirmPassword: "Passwords do not match.",
                              }));
                            else
                              setFieldErrors((prev) => ({
                                ...prev,
                                confirmPassword: "",
                              }));
                          }}
                          className={cn(
                            "pr-10",
                            (formData.confirmPassword && !passwordMatch) ||
                              fieldErrors.confirmPassword
                              ? "border-destructive focus-visible:ring-destructive"
                              : "",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {(fieldErrors.confirmPassword ||
                        (formData.confirmPassword && !passwordMatch)) && (
                        <p className="text-xs text-destructive">
                          {fieldErrors.confirmPassword ||
                            "Passwords do not match."}
                        </p>
                      )}
                    </div>

                    <OAuthButtons />
                  </>
                )}

                {/* ── Step 2: Profile / Identity ── */}
                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="first_name">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="first_name"
                          type="text"
                          placeholder="Maria"
                          required
                          autoComplete="given-name"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              first_name: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            validateField("first_name", e.target.value)
                          }
                          className={cn(
                            fieldErrors.first_name &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {fieldErrors.first_name && (
                          <p className="text-xs text-destructive">
                            {fieldErrors.first_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="last_name">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="last_name"
                          type="text"
                          placeholder="Santos"
                          required
                          autoComplete="family-name"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              last_name: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            validateField("last_name", e.target.value)
                          }
                          className={cn(
                            fieldErrors.last_name &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {fieldErrors.last_name && (
                          <p className="text-xs text-destructive">
                            {fieldErrors.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone_number">
                          Mobile Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone_number"
                          type="tel"
                          placeholder="+63 917 123 4567"
                          autoComplete="tel"
                          value={formData.phone_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone_number: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            validateField("phone_number", e.target.value)
                          }
                          className={cn(
                            fieldErrors.phone_number &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {fieldErrors.phone_number && (
                          <p className="text-xs text-destructive">
                            {fieldErrors.phone_number}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="date_of_birth">
                          Date of Birth{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          required
                          value={formData.date_of_birth}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date_of_birth: e.target.value,
                            })
                          }
                          onBlur={(e) =>
                            validateField("date_of_birth", e.target.value)
                          }
                          className={cn(
                            fieldErrors.date_of_birth &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {fieldErrors.date_of_birth && (
                          <p className="text-xs text-destructive">
                            {fieldErrors.date_of_birth}
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedRole === "learner" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="degree_program">
                            Degree Program{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="degree_program"
                            type="text"
                            placeholder="e.g. BS Computer Science"
                            required
                            value={formData.degree_program}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                degree_program: e.target.value,
                              })
                            }
                            onBlur={(e) =>
                              validateField("degree_program", e.target.value)
                            }
                            className={cn(
                              fieldErrors.degree_program &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                          />
                          {fieldErrors.degree_program && (
                            <p className="text-xs text-destructive">
                              {fieldErrors.degree_program}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="year_level">
                            Year Level{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <select
                            id="year_level"
                            required
                            value={formData.year_level}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                year_level: e.target.value,
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {[1, 2, 3, 4, 5, 6].map((y) => (
                              <option key={y} value={y}>
                                Year {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="academic_year_joined">
                        Academic Year Joined{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="academic_year_joined"
                        required
                        value={formData.academic_year_joined}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academic_year_joined: e.target.value,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="2022-2023">2022-2023</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                      </select>
                    </div>

                    {selectedRole === "tutor" && (
                      <div className="flex items-center gap-2.5 bg-muted/50 p-3 rounded-lg border border-border/50">
                        <input
                          type="checkbox"
                          id="esas_scholar"
                          checked={formData.esas_scholar}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              esas_scholar: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary bg-background accent-primary"
                        />
                        <Label
                          htmlFor="esas_scholar"
                          className="text-sm font-medium cursor-pointer"
                        >
                          I am an ESAS Scholar
                        </Label>
                      </div>
                    )}
                  </>
                )}

                {/* ── Step 3: Review & Submit ── */}
                {step === 3 && (
                  <>
                    <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Review your information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Role</p>
                          <p className="font-medium capitalize">
                            {selectedRole}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <p className="font-medium truncate">
                            {formData.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Name</p>
                          <p className="font-medium">
                            {formData.first_name} {formData.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Phone</p>
                          <p className="font-medium">
                            {formData.phone_number || "—"}
                          </p>
                        </div>
                        {selectedRole === "learner" && (
                          <>
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Program
                              </p>
                              <p className="font-medium">
                                {formData.degree_program || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Year Level
                              </p>
                              <p className="font-medium">
                                Year {formData.year_level}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Academic Year
                          </p>
                          <p className="font-medium">
                            {formData.academic_year_joined}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        checked={formData.terms_accepted}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            terms_accepted: e.target.checked,
                          })
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-xs leading-relaxed font-normal cursor-pointer text-muted-foreground"
                      >
                        I agree to the{" "}
                        <TosLink className="text-foreground underline hover:no-underline font-medium" />{" "}
                        and{" "}
                        <PrivacyLink className="text-foreground underline hover:no-underline font-medium" />
                        <span className="text-destructive"> *</span>
                      </Label>
                    </div>
                  </>
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
