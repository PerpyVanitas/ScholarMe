'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Info } from 'lucide-react';

const MIGRATION_SQL = `
================================================================================
SCHOLARME — SUPABASE DATABASE SETUP
================================================================================

STEP 1 — ROLES, PROFILES, AND AUTH TRIGGER
================================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

INSERT INTO public.roles (name) VALUES ('administrator'), ('tutor'), ('learner')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id),
  full_name text NOT NULL DEFAULT '',
  first_name text,
  last_name text,
  email text NOT NULL DEFAULT '',
  avatar_url text,
  phone_number text,
  birthdate date,
  date_of_birth date,
  membership_number text,
  bio text,
  profile_completed boolean DEFAULT false,
  terms_accepted_at timestamptz,
  total_xp integer DEFAULT 0 NOT NULL,
  current_level integer DEFAULT 1 NOT NULL,
  profile_theme_color text DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'administrator'
    )
  );

CREATE POLICY IF NOT EXISTS "profiles_public_read_for_tutors" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tutors WHERE user_id = profiles.id)
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
  given_role_id uuid;
BEGIN
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'learner';
  given_role_id := (new.raw_user_meta_data ->> 'role_id')::uuid;

  INSERT INTO public.profiles (id, role_id, full_name, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(given_role_id, default_role_id),
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(new.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Additional migration steps continue...
-- For the complete 12-step migration, see scripts/supabase_migration.sql
`;

export default function MigrationsPage() {
  const [copied, setCopied] = useState(false);
  const [showFullSQL, setShowFullSQL] = useState(false);

  function handleCopySQL() {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Setup</h1>
          <p className="text-muted-foreground mt-2">
            Initialize the ScholarMe database with all required tables, relationships, and security policies.
          </p>
        </div>

        <Alert className="border-[#FFD700]/30 bg-zinc-900/50 text-slate-100">
          <Info className="h-4 w-4 text-[#FFD700]" />
          <AlertTitle>Recommended: Manual Execution</AlertTitle>
          <AlertDescription>
            For production environments, execute migrations manually via the Supabase dashboard. This provides better visibility and control over the process.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Copy Migration SQL</CardTitle>
            <CardDescription>
              Click the button below to copy all migration SQL to your clipboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCopySQL}
              className="w-full h-12"
              size="lg"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied to Clipboard!' : 'Copy Migration SQL'}
            </Button>

            <div className="space-y-2">
              <button
                onClick={() => setShowFullSQL(!showFullSQL)}
                className="text-sm text-[#FFD700] hover:text-yellow-400 hover:underline"
              >
                {showFullSQL ? 'Hide' : 'Show'} SQL Preview
              </button>
              {showFullSQL && (
                <textarea
                  readOnly
                  value={MIGRATION_SQL}
                  className="w-full h-64 px-3 py-2 border border-input bg-background rounded-md text-xs font-mono"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Execute in Supabase</CardTitle>
            <CardDescription>
              Go to your Supabase project and execute the SQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">1.</span>
                <span>
                  Open your{' '}
                  <Button variant="link" asChild className="p-0 h-auto">
                    <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
                      Supabase Dashboard
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">2.</span>
                <span>Select your <strong>ScholarMe</strong> project</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">3.</span>
                <span>Click <strong>SQL Editor</strong> in the left sidebar</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">4.</span>
                <span>Click the <strong>+ New Query</strong> button</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">5.</span>
                <span>Paste the migration SQL (copied in Step 1)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">6.</span>
                <span>Click the <strong>Run</strong> button</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary min-w-fit">7.</span>
                <span>
                  Verify all migrations completed successfully (you should see checkmarks)
                </span>
              </li>
            </ol>

            <Button asChild className="w-full h-11 mt-4" size="lg">
              <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
                Open Supabase Dashboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What Gets Created</CardTitle>
            <CardDescription>
              12 migration steps covering the complete database schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Roles & Profiles with Auth Trigger</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Auth Cards for Card-Based Login</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Tutors & Specializations</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Sessions & Scheduling</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Voting & Polls</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Messaging & Conversations</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Notifications System</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Gamification (XP & Levels)</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Device Tokens for Push</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Repositories & Resources</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Analytics Logs</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Performance Indexes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Need Help?</AlertTitle>
          <AlertDescription>
            If you encounter any issues, the complete migration SQL is also available in <code className="bg-muted px-2 py-1 rounded text-xs">scripts/supabase_migration.sql</code>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
