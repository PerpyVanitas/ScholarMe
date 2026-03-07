/** Sign-up page -- creates a new learner or tutor account via Supabase Auth. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, BookOpen, Users, Eye, EyeOff } from "lucide-react";
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
          <p className="text-sm text-muted-foreground">Create your tutoring account</p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign Up</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              {/* Role selector */}
              <div className="flex flex-col gap-2">
                <Label>I want to join as</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["learner", "tutor"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                        selectedRole === r
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      {r === "learner"
                        ? <BookOpen className={cn("h-6 w-6", selectedRole === r ? "text-primary" : "text-muted-foreground")} />
                        : <Users className={cn("h-6 w-6", selectedRole === r ? "text-primary" : "text-muted-foreground")} />
                      }
                      <span className={cn("text-sm font-medium", selectedRole === r ? "text-primary" : "text-foreground")}>
                        {r === "learner" ? "Learner" : "Tutor"}
                      </span>
                      <span className="text-[11px] leading-tight text-muted-foreground text-center">
                        {r === "learner" ? "Browse tutors and book sessions" : "Teach others and share resources"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                <Input id="full_name" type="text" placeholder="Jane Doe" required autoComplete="name"
                  value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" required autoComplete="email"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input id="phone_number" type="tel" placeholder="+1 (555) 000-0000" autoComplete="tel"
                  value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="date_of_birth">Date of Birth <span className="text-destructive">*</span></Label>
                <Input id="date_of_birth" type="date" required
                  value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                <p className="text-xs text-muted-foreground">Must be at least 13 years old</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={cn("pr-10", !passwordMatch && "border-destructive")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password" required minLength={8} autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, confirmPassword: val });
                      setPasswordMatch(val === formData.password);
                    }}
                    className={cn("pr-10", !passwordMatch && "border-destructive")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!passwordMatch && <p className="text-xs text-destructive">Passwords do not match</p>}
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" required
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary" />
                <Label htmlFor="terms" className="text-xs leading-relaxed font-normal cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary underline hover:no-underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary underline hover:no-underline">Privacy Policy</Link>
                  {" "}<span className="text-destructive">*</span>
                </Label>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !formData.terms_accepted}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                ) : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
