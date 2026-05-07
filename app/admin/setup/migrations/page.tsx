'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';

interface MigrationResult {
  index: number;
  status: 'success' | 'error' | 'pending';
  message?: string;
  statement?: string;
}

export default function MigrationsPage() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteMigrations = async () => {
    setIsExecuting(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch('/api/admin/setup/migrate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || ''}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to execute migrations');
        return;
      }

      setResults(data.results || []);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Migrations</h1>
          <p className="text-muted-foreground mt-2">
            Initialize the ScholarMe database schema with all required tables, relationships, and policies.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Migration Status</CardTitle>
            <CardDescription>
              Execute 12 migration steps to set up the complete ScholarMe database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExecuteMigrations}
                disabled={isExecuting}
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Migrations...
                  </>
                ) : (
                  'Execute Migrations'
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                This will create all necessary tables and configure security policies.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {summary && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Migration Summary</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Total: <strong>{summary.total}</strong></p>
                      <p>Successful: <strong className="text-green-600">{summary.successful}</strong></p>
                      <p>Failed: <strong className={summary.failed > 0 ? 'text-red-600' : ''}>{summary.failed}</strong></p>
                      {summary.pending > 0 && (
                        <p>Pending: <strong className="text-yellow-600">{summary.pending}</strong></p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {results.length > 0 && (
                  <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                    <div className="space-y-2">
                      {results.map((result) => (
                        <div
                          key={result.index}
                          className="flex items-start gap-2 text-sm"
                        >
                          {result.status === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          )}
                          {result.status === 'error' && (
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          {result.status === 'pending' && (
                            <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">
                              [{result.index}] {result.status.toUpperCase()}
                            </p>
                            {result.message && (
                              <p className="text-muted-foreground">{result.message}</p>
                            )}
                            {result.statement && (
                              <p className="font-mono text-xs text-muted-foreground mt-1 break-all">
                                {result.statement}...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Migration</CardTitle>
            <CardDescription>
              If automated migration fails, execute manually via Supabase Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your Supabase project dashboard</li>
              <li>Click on "SQL Editor" in the left sidebar</li>
              <li>Click "New Query"</li>
              <li>Copy the entire content of <code className="bg-muted px-2 py-1 rounded">scripts/supabase_migration.sql</code></li>
              <li>Paste it into the SQL editor</li>
              <li>Click "Execute" button</li>
            </ol>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                This file contains all 12 migration steps needed to set up the complete database schema.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migration Includes</CardTitle>
            <CardDescription>
              12 steps covering the complete database schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>✓ Roles and Profiles with Auth Trigger</li>
              <li>✓ Auth Cards for card-based login</li>
              <li>✓ Tutors and Specializations</li>
              <li>✓ Sessions and Scheduling</li>
              <li>✓ Voting and Polls</li>
              <li>✓ Messaging and Conversations</li>
              <li>✓ Notifications System</li>
              <li>✓ Gamification (XP and Levels)</li>
              <li>✓ Device Tokens for Push Notifications</li>
              <li>✓ Repositories and Resources</li>
              <li>✓ Analytics Logs</li>
              <li>✓ Performance Indexes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
