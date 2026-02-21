import { writeFileSync } from 'fs';
import { join } from 'path';

const content = `"use strict";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client (respects RLS)
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // read-only context (Server Components)
          }
        },
      },
    }
  );
}

// Admin client (bypasses RLS, uses service role key)
export async function createAdminClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // read-only context (Server Components)
          }
        },
      },
    }
  );
}
`;

const filePath = join(process.cwd(), 'lib', 'supabase', 'server.ts');
writeFileSync(filePath, content, 'utf8');
console.log('Successfully wrote clean server.ts to:', filePath);

// Also try to clear .next cache
import { rmSync, existsSync } from 'fs';
const nextDir = join(process.cwd(), '.next');
if (existsSync(nextDir)) {
  try {
    rmSync(nextDir, { recursive: true, force: true });
    console.log('Cleared .next cache directory');
  } catch (e) {
    console.log('Could not clear .next cache:', e.message);
  }
} else {
  console.log('.next directory does not exist');
}
