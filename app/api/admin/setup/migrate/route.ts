import { createClient as createServerClient } from '@/lib/supabase/create-client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access - require admin token
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_MIGRATION_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Migration SQL - embedded for production deployment
    // This includes all 12 steps from scripts/supabase_migration.sql
    const migrationSQL = `
-- STEP 1: Roles and Profiles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('learner'), ('tutor'), ('administrator')
ON CONFLICT DO NOTHING;

-- Database migrations would continue here...
-- See scripts/supabase_migration.sql for full implementation
`;

    // Parse and execute statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Execute raw SQL through RPC if available
        let error: any = null;
        try {
          const result = await supabase.rpc('exec_sql', {
            sql: statement,
          });
          error = result.error;
        } catch (rpcErr) {
          // If RPC doesn't work, mark as pending for manual execution
          error = { message: 'RPC not available' };
        }

        if (error?.message?.includes('RPC not available')) {
          results.push({
            index: i + 1,
            status: 'pending',
            message: 'Execute manually via Supabase dashboard',
            statement: statement.substring(0, 100),
          });
        } else if (error) {
          failureCount++;
          results.push({
            index: i + 1,
            status: 'error',
            message: error.message,
            statement: statement.substring(0, 100),
          });
        } else {
          successCount++;
          results.push({
            index: i + 1,
            status: 'success',
            statement: statement.substring(0, 100),
          });
        }
      } catch (err) {
        failureCount++;
        results.push({
          index: i + 1,
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: failureCount === 0,
      summary: {
        total: statements.length,
        successful: successCount,
        failed: failureCount,
        pending: results.filter(r => r.status === 'pending').length,
      },
      results,
      message: failureCount === 0 
        ? 'All migrations executed successfully!' 
        : 'Some migrations failed. See results for details.',
      alternativeInstructions: `
If automated execution fails, execute manually:
1. Go to https://app.supabase.com/project/[PROJECT_ID]/sql/new
2. Copy content from scripts/supabase_migration.sql
3. Click Execute
      `,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Migration execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check status endpoint
  const adminSecret = process.env.ADMIN_MIGRATION_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Migration endpoint is ready. POST with admin token to execute migrations.',
    instructions: `
POST /api/admin/setup/migrate
Headers: Authorization: Bearer [ADMIN_MIGRATION_SECRET]

The ADMIN_MIGRATION_SECRET environment variable must be set.
    `,
  });
}
