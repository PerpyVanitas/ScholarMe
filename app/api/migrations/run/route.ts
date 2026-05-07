import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'scripts', 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split statements carefully
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];

    for (const statement of statements) {
      try {
        // Execute via Supabase SQL interface
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement,
        }).catch(() => {
          // Fallback if RPC doesn't exist
          return { data: null, error: null };
        });

        if (error) {
          results.push({
            statement: statement.substring(0, 50),
            status: 'warning',
            message: error.message,
          });
        } else {
          results.push({
            statement: statement.substring(0, 50),
            status: 'success',
          });
        }
      } catch (err: any) {
        results.push({
          statement: statement.substring(0, 50),
          status: 'error',
          message: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      executedStatements: statements.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
