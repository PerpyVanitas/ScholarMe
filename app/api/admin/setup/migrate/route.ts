import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Check authorization using the token provided in the cURL command
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_MIGRATION_SECRET || 'scholarme-admin-migration';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    // 2. We must use a direct Postgres connection string to execute raw SQL, 
    // because Supabase REST APIs (used by supabase-js) block raw SQL execution.
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      return NextResponse.json(
        { 
          error: 'Missing direct database connection string.', 
          resolution: 'Please add DATABASE_URL (the Postgres connection string from your Supabase project settings) to your Vercel environment variables.' 
        },
        { status: 500 }
      );
    }

    // 3. Connect to the database
    const client = new Client({
      connectionString,
      // For Supabase connection pooler, ssl is usually required
      ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined
    });

    await client.connect();

    // 4. Read the migration SQL files
    const migrationsDir = path.join(process.cwd(), 'scripts', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      await client.end();
      return NextResponse.json({ error: 'Migrations directory not found at scripts/migrations' }, { status: 500 });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure 01, 02, 03... order

    if (files.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No .sql migration files found in scripts/migrations' }, { status: 400 });
    }

    console.log(`[Migration API] Found ${files.length} migration files. Executing sequentially...`);
    const executedFiles = [];

    // 5. Execute each SQL file sequentially using the pg client
    for (const file of files) {
      console.log(`[Migration API] Executing ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        executedFiles.push(file);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`[Migration Error] Failed in ${file}:`, err);
        throw new Error(`Failed executing ${file}: ${err.message}`);
      }
    }

    // 6. Cleanup and return
    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Supabase migrations executed successfully. All tables, functions, and RLS policies have been created.',
      executedFiles,
    });
  } catch (error: any) {
    console.error('[Migration Error]', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check status endpoint
  const adminSecret = process.env.ADMIN_MIGRATION_SECRET || 'scholarme-admin-migration';
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== adminSecret) {
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

The DATABASE_URL environment variable must also be set for raw SQL execution.
    `,
  });
}
