"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Toggle to true when Google / Azure OAuth providers are configured in Supabase
const ENABLE_OAUTH_PROVIDERS = process.env.NODE_ENV === "test" ? true : false;

export function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "azure" | null>(null);

  if (!ENABLE_OAUTH_PROVIDERS) {
    return null;
  }

  const handleOAuth = async (provider: "google" | "azure") => {
    try {
      setLoading(provider);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(error);
        if (
          error.message?.toLowerCase().includes("not enabled") ||
          error.status === 400
        ) {
          toast.error(
            `${
              provider === "google" ? "Google" : "Microsoft"
            } sign-in is not enabled in your Supabase project dashboard. Please enable it under Authentication -> Providers.`,
            { duration: 6000 },
          );
        } else {
          toast.error(error.message);
        }
        setLoading(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to authentication provider.");
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuth("google")}
        >
          {loading === "google" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
          )}
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuth("azure")}
        >
          {loading === "azure" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 21 21"
              fill="currentColor"
            >
              <rect x="1" y="1" width="9" height="9" />
              <rect x="11" y="1" width="9" height="9" />
              <rect x="1" y="11" width="9" height="9" />
              <rect x="11" y="11" width="9" height="9" />
            </svg>
          )}
          Microsoft
        </Button>
      </div>
    </div>
  );
}
