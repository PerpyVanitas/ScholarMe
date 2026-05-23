const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. Check .env.example for the full list.`
    );
  }
}

// Fallback for Vercel Deployments
if (!process.env.NEXT_PUBLIC_APP_URL) {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else {
    // We only throw if we aren't in Vercel and it's missing
    console.warn("Missing NEXT_PUBLIC_APP_URL. Falling back to localhost.");
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  }
}

export {};
