/** Sign-up page -- two-column industry-standard layout with branded left panel. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, BookOpen, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Please sign in instead.";
  if (m.includes("invalid email")) return "Please enter a valid email address.";
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("least"))) return "Password must be at least 8 characters long.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment before trying again.";
  return msg || "An unexpected error occurred. Please try again.";
}

// Validation rules
const VALIDATORS = {
  full_name: (v: string) => {
    if (!v.trim()) return "Full name is required.";
    if (/\d/.test(v)) return "Full name must not contain numbers.";
    if (v.trim().length < 2) return "Full name must be at least 2 characters.";
    return "";
  },
  email: (v: string) => {
    if (!v.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address (e.g. you@example.com).";
    return "";
  },
  phone_number: (v: string) => {
    if (!v) return ""; // optional
    const digits = v.replace(/[\s\-().+]/g, "");
    // Philippine mobile: starts with 09 (11 digits) or +639 (12 digits with country code)
    const isLocal = /^09\d{9}$/.test(digits);
    const isIntl = /^639\d{9}$/.test(digits);
    if (!isLocal && !isIntl) return "Enter a valid Philippine mobile number (e.g. +63 917 123 4567 or 0917 123 4567).";
    return "";
  },
  date_of_birth: (v: string) => {
    if (!v) return "Date of birth is required.";
    const dob = new Date(v);
    if (isNaN(dob.getTime())) return "Please enter a valid date.";
    if (dob > new Date()) return "Date of birth cannot be in the future.";
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
    if (age < 13) return "You must be at least 13 years old to register.";
    if (age > 120) return "Please enter a valid date of birth.";
    return "";
  },
  password: (v: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    return "";
  },
};

const FEATURES = [
  "Connect with verified expert tutors",
  "Book and manage sessions with ease",
  "Access shared learning resources",
  "Track your progress over time",
];

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateField(name: keyof typeof VALIDATORS, value: string) {
    const err = VALIDATORS[name]?.(value) ?? "";
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return err;
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

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!validateAll()) {
      setError("Please fix the errors above before continuing.");
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (!formData.terms_accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      toast.error("Please accept the terms to continue.");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.set("email", formData.email);
    fd.set("password", formData.password);
    fd.set("full_name", formData.full_name);
    fd.set("phone_number", formData.phone_number);
    fd.set("date_of_birth", formData.date_of_birth);
    fd.set("role", selectedRole);

    const result = await signUp(fd);
    if (result?.error) {
      const msg = mapAuthError(result.error);
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }
    toast.success("Account created! Setting up your profile...");
    window.location.href = "/auth/setup-profile";
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

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-destructive", "bg-warning", "bg-primary", "bg-success"][passwordStrength];

  return (
    <div className="flex min-h-screen">
      {/* Left branded panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-between bg-sidebar p-10 text-sidebar-foreground">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
            <GraduationCap className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">ScholarMe</span>
        </Link>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-sidebar-foreground/55">Join thousands of learners</p>
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Start your learning journey today
            </h2>
            <p className="text-base leading-relaxed text-sidebar-foreground/70">
              ScholarMe connects students with expert tutors for personalized, flexible learning — on your schedule.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-sidebar-foreground/80">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/35">
          &copy; {new Date().getFullYear()} ScholarMe. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background px-6 py-10">
        {/* Mobile logo */}
        <div className="mb-6 flex lg:hidden items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">ScholarMe</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Already have one?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
            {/* Role selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">I want to join as</Label>
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
                        : "border-border hover:border-primary/40 bg-card"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      selectedRole === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {r === "learner"
                        ? <BookOpen className="h-4 w-4" />
                        : <Users className="h-4 w-4" />
                      }
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", selectedRole === r ? "text-primary" : "text-foreground")}>
                        {r === "learner" ? "Learner" : "Tutor"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {r === "learner" ? "Find & book tutors" : "Teach & earn"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="full_name" type="text" placeholder="Maria Santos" required autoComplete="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                onBlur={(e) => validateField("full_name", e.target.value)}
                className={cn(fieldErrors.full_name && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldErrors.full_name && <p className="text-xs text-destructive">{fieldErrors.full_name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email" type="text" placeholder="you@example.com" required autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={(e) => validateField("email", e.target.value)}
                className={cn(fieldErrors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            {/* Phone + DOB side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone_number">Mobile Number</Label>
                <Input
                  id="phone_number" type="tel" placeholder="+63 917 123 4567" autoComplete="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  onBlur={(e) => validateField("phone_number", e.target.value)}
                  className={cn(fieldErrors.phone_number && "border-destructive focus-visible:ring-destructive")}
                />
                {fieldErrors.phone_number && <p className="text-xs text-destructive">{fieldErrors.phone_number}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date_of_birth">Date of Birth <span className="text-destructive">*</span></Label>
                <Input
                  id="date_of_birth" type="date" required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  onBlur={(e) => validateField("date_of_birth", e.target.value)}
                  className={cn(fieldErrors.date_of_birth && "border-destructive focus-visible:ring-destructive")}
                />
                {fieldErrors.date_of_birth && <p className="text-xs text-destructive">{fieldErrors.date_of_birth}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required minLength={8} autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={(e) => validateField("password", e.target.value)}
                  className={cn("pr-10", fieldErrors.password && "border-destructive focus-visible:ring-destructive")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
              {/* Password strength bar */}
              {formData.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        i <= passwordStrength ? strengthColor : "bg-border"
                      )} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  required minLength={8} autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, confirmPassword: val });
                    const match = val === formData.password || val === "";
                    setPasswordMatch(match);
                    if (!match) setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
                    else setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  className={cn("pr-10", (formData.confirmPassword && !passwordMatch) || fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : "")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {(fieldErrors.confirmPassword || (formData.confirmPassword && !passwordMatch)) && (
                <p className="text-xs text-destructive">{fieldErrors.confirmPassword || "Passwords do not match."}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox" id="terms" required
                checked={formData.terms_accepted}
                onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              />
              <Label htmlFor="terms" className="text-xs leading-relaxed font-normal cursor-pointer text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-foreground underline hover:no-underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-foreground underline hover:no-underline">Privacy Policy</Link>
                <span className="text-destructive"> *</span>
              </Label>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading || !formData.terms_accepted}
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                : "Create Account"
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
