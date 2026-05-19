import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.MIGRATION_TOKEN || 'scholarme-admin-migration';
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Parse statements
    const statements = parseSQLStatements(migrationSQL);

    console.log(`[Migration API] Executing ${statements.length} statements`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Execute statements via Supabase API
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const stmtType = stmt.split(/\s+/)[0].toUpperCase();

      try {
        // Call Supabase PostgreSQL REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: stmt }),
        });

        if (response.ok) {
          successCount++;
          results.push({
            index: i + 1,
            type: stmtType,
            status: 'success',
            preview: stmt.substring(0, 50),
          });
        } else {
          // Try with pooling connection instead
          const poolResponse = await executeViaPooling(stmt, supabaseUrl, supabaseServiceKey);
          
          if (poolResponse.ok) {
            successCount++;
            results.push({
              index: i + 1,
              type: stmtType,
              status: 'success (pooled)',
              preview: stmt.substring(0, 50),
            });
          } else {
            failureCount++;
            results.push({
              index: i + 1,
              type: stmtType,
              status: 'error',
              preview: stmt.substring(0, 50),
              message: await poolResponse.text(),
            });
          }
        }
      } catch (err: any) {
        failureCount++;
        results.push({
          index: i + 1,
          type: stmtType,
          status: 'error',
          preview: stmt.substring(0, 50),
          message: err.message,
        });
      }
    }

    return NextResponse.json({
      success: failureCount === 0,
      summary: {
        total: statements.length,
        successCount,
        failureCount,
      },
      results: results.slice(0, 20), // Return first 20 for brevity
      totalResults: results.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function parseSQLStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  let dollarCount = 0;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();

    // Skip comments and headers
    if (trimmed.startsWith('--') || trimmed.startsWith('=')) {
      continue;
    }

    // Track function definitions
    if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
      inFunction = true;
    }

    // Track $$ markers
    if (inFunction && trimmed.includes('$$')) {
      dollarCount++;
    }

    current += line + '\n';

    // Statement end detection
    if (trimmed.endsWith(';') && !inFunction) {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
    } else if (inFunction && dollarCount >= 2 && trimmed.endsWith(';')) {
      inFunction = false;
      dollarCount = 0;
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function executeViaPooling(
  sql: string,
  supabaseUrl: string,
  serviceKey: string
): Promise<Response> {
  const poolUrl = supabaseUrl.replace('/rest/v1', '');
  return fetch(`${poolUrl}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ sql }),
  });
}
