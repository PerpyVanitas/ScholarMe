/** Sign-up page -- creates a new learner account via Supabase Auth. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"learner" | "tutor">("learner");

  async function handleSignUp(formData: FormData) {
    setLoading(true);
    setError("");
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success("Account created successfully!");
    router.push("/dashboard");
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
            <form action={handleSignUp} className="flex flex-col gap-4">
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
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
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
