import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignUpSuccessScreen({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center py-10">
      <div className="bg-primary/10 p-4 rounded-full">
        <MailCheck className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Check your email
      </h1>
      <p className="text-base text-muted-foreground">
        We&apos;ve sent a verification link to{" "}
        <span className="font-medium text-foreground">{email}</span>. Please
        click the link to activate your account.
      </p>
      <div className="pt-4 flex flex-col gap-3 w-full">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/auth/login">Return to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
