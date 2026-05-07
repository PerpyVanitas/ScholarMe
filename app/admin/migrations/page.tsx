'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MigrationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigrations() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrations/execute', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer scholarme-admin-migration',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Migration failed');
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Database Migrations</CardTitle>
            <CardDescription>
              Execute Supabase schema migrations for ScholarMe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                This will execute all migrations from the migration file. Make sure you have administrative access.
              </p>
            </div>

            <Button
              onClick={runMigrations}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Running migrations...' : 'Execute Migrations'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    {result.success
                      ? '✓ Migrations completed successfully!'
                      : '⚠ Some migrations had errors. See details below.'}
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="text-sm">
                    <p>
                      <strong>Total:</strong> {result.summary.total}
                    </p>
                    <p className="text-green-600">
                      <strong>Successful:</strong> {result.summary.successCount}
                    </p>
                    <p className="text-red-600">
                      <strong>Failed:</strong> {result.summary.failureCount}
                    </p>
                  </div>
                </div>

                {result.results.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Recent Statements:</h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {result.results.map((r: any) => (
                        <div
                          key={r.index}
                          className="text-xs p-2 bg-background rounded border"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono">
                              [{r.index}] {r.type}
                            </span>
                            <span
                              className={
                                r.status === 'success'
                                  ? 'text-green-600'
                                  : r.status.includes('error')
                                  ? 'text-red-600'
                                  : 'text-yellow-600'
                              }
                            >
                              {r.status}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {r.preview}...
                          </div>
                          {r.message && (
                            <div className="text-red-500 mt-1">{r.message}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.totalResults > result.results.length && (
                  <p className="text-xs text-muted-foreground">
                    Showing {result.results.length} of {result.totalResults} statements
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
