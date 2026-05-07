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

    // 4. Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', 'scholarme_supabase_setup.txt');
    
    if (!fs.existsSync(migrationPath)) {
      await client.end();
      return NextResponse.json({ error: 'Migration SQL file not found at scripts/scholarme_supabase_setup.txt' }, { status: 500 });
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // 5. Execute the SQL directly using the pg client
    // By running the whole file at once, Postgres handles function creation and transactions properly
    console.log('[Migration API] Executing raw SQL migration...');
    await client.query(sql);

    // 6. Cleanup and return
    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Supabase migration executed successfully. All tables, functions, and RLS policies have been created.',
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
