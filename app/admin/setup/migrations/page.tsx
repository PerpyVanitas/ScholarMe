'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ExternalLink, Info, FileText } from 'lucide-react';

export default function MigrationsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Setup</h1>
          <p className="text-muted-foreground mt-2">
            Initialize the ScholarMe database with all required tables, relationships, and security policies.
          </p>
        </div>

        <Alert className="border-primary/30 bg-zinc-900/50 text-slate-100">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Security Update: Manual Execution Required</AlertTitle>
          <AlertDescription>
            To prevent exposing our database schema to the public client bundle, the migration SQL has been moved securely to the backend repository. Please execute the migrations manually via the Supabase dashboard.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Locate Migration File</CardTitle>
            <CardDescription>
              Find the migration script in your local project repository.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/50">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">MIGRATION_CLEAN.sql</p>
                <p className="text-xs text-muted-foreground">Located in the root of your project directory.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Open this file in your code editor and copy its entire contents to your clipboard.
            </p>
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
                <span>Paste the migration SQL from your code editor</span>
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
              Complete database schema features
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
            </ul>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Need Help?</AlertTitle>
          <AlertDescription>
            If you encounter any issues, please ensure you execute the file exactly as provided in <code className="bg-muted px-2 py-1 rounded text-xs">MIGRATION_CLEAN.sql</code>.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
