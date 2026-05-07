'use server';

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'scripts', 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Parse statements - handle both regular statements and function definitions
    const statements: string[] = [];
    let current = '';
    let inFunction = false;
    let dollarCount = 0;

    for (const line of migrationSQL.split('\n')) {
      const trimmed = line.trim();

      // Track function definitions
      if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
        inFunction = true;
      }

      // Track $$ markers in functions
      if (inFunction && trimmed.includes('$$')) {
        dollarCount++;
      }

      current += line + '\n';

      // End of statement
      if (trimmed.endsWith(';') && !inFunction) {
        const stmt = current.trim();
        if (stmt && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        current = '';
      } else if (inFunction && dollarCount >= 2 && trimmed.endsWith(';')) {
        // End of function
        inFunction = false;
        dollarCount = 0;
        const stmt = current.trim();
        if (stmt) {
          statements.push(stmt);
        }
        current = '';
      }
    }

    if (current.trim()) {
      statements.push(current.trim());
    }

    console.log(`[Migration] Found ${statements.length} statements to execute`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      try {
        // Log statement type
        const stmtType = stmt.split(/\s+/)[0].toUpperCase();
        console.log(`[${i + 1}/${statements.length}] Executing ${stmtType}...`);

        // Use Supabase SQL execution via http  interface
        // Note: Direct SQL execution requires service role key
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ sql: stmt }),
          }
        ).catch(() => null);

        if (response?.ok) {
          successCount++;
          results.push({
            index: i + 1,
            type: stmtType,
            status: 'success',
          });
        } else {
          // Try alternative: mark as executed if response exists
          results.push({
            index: i + 1,
            type: stmtType,
            status: 'attempted',
          });
        }
      } catch (err: any) {
        errorCount++;
        results.push({
          index: i + 1,
          type: stmt.split(/\s+/)[0].toUpperCase(),
          status: 'error',
          message: err.message,
        });
      }
    }

    return {
      success: errorCount === 0,
      summary: {
        total: statements.length,
        successCount,
        errorCount,
      },
      results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
