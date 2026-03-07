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

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    if (!formData.terms_accepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      toast.error("Please accept the terms to continue.");
      return;
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
      if (age < 13) {
        setError("You must be at least 13 years old to create an account.");
        toast.error("You must be at least 13 years old.");
        return;
      }
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
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-between bg-primary p-10 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ScholarMe</span>
        </Link>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Join thousands of learners</p>
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Start your learning journey today
            </h2>
            <p className="text-base leading-relaxed text-white/75">
              ScholarMe connects students with expert tutors for personalized, flexible learning — on your schedule.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">
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
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
              <Input
                id="email" type="email" placeholder="you@example.com" required autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Phone + DOB side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone_number">Mobile Number</Label>
                <Input
                  id="phone_number" type="tel" placeholder="+63 917 123 4567" autoComplete="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date_of_birth">Date of Birth <span className="text-destructive">*</span></Label>
                <Input
                  id="date_of_birth" type="date" required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
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
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                    setPasswordMatch(val === formData.password || val === "");
                  }}
                  className={cn("pr-10", formData.confirmPassword && !passwordMatch && "border-destructive focus-visible:ring-destructive")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
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
