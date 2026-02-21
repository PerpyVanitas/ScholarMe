/** Login page -- supports email/password and card-based authentication. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Mail, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [emailLoading, setEmailLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [cardError, setCardError] = useState("");

  async function handleEmailLogin(formData: FormData) {
    setEmailLoading(true);
    setEmailError("");

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setEmailError(error.message);
      toast.error(error.message);
      setEmailLoading(false);
      return;
    }

    // Hard redirect so server re-reads fresh auth cookies
    window.location.href = "/dashboard";
  }

  async function handleCardLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCardLoading(true);
    setCardError("");

    const formData = new FormData(e.currentTarget);
    const cardId = formData.get("card_id") as string;
    const pin = formData.get("pin") as string;

    try {
      const res = await fetch("/api/auth/card-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCardError(data.error || "Login failed");
        toast.error(data.error || "Login failed");
      } else {
        toast.success("Welcome back!");
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      setCardError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    }
    setCardLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ScholarMe</h1>
          </div>
          <p className="text-sm text-muted-foreground text-balance">
            Sign in to your tutoring account
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Card ID</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEmailLogin(new FormData(e.currentTarget));
                  }}
                  className="flex flex-col gap-4"
                >
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
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {emailError && (
                    <p className="text-sm text-destructive" role="alert">{emailError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={emailLoading}>
                    {emailLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="card">
                <form onSubmit={handleCardLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="card_id">Card ID</Label>
                    <Input
                      id="card_id"
                      name="card_id"
                      type="text"
                      placeholder="Enter your card ID"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      name="pin"
                      type="password"
                      placeholder="Enter your PIN"
                      required
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                  {cardError && (
                    <p className="text-sm text-destructive" role="alert">{cardError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={cardLoading}>
                    {cardLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Sign In with Card"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {"Don't have an account?"}{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Or contact your administrator for card-based credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
