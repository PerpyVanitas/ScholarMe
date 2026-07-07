import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' },
  });

  try {
    console.log('Connecting to Supabase...');
    console.log('URL: ' + supabaseUrl);

    const migrationPath = path.join(__dirname, 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    const statements = migrationSQL.split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log('Found ' + statements.length + ' SQL statements to execute\n');

    const results = [];
    let successCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error?.message?.includes('Could not find the function')) {
          console.log('[WARNING] RPC exec_sql not available - requires manual execution in Supabase');
          results.push({ status: 'pending', message: 'Requires manual execution in Supabase dashboard' });
        } else if (error) {
          console.log('Error: ' + error.message);
          results.push({ status: 'error', message: error.message });
        } else {
          console.log('Executed statement ' + (i+1));
          successCount++;
          results.push({ status: 'success' });
        }
      } catch (err) {
        console.log('Exception: ' + err.message);
        results.push({ status: 'error', message: err.message });
      }
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log('Total statements: ' + statements.length);
    console.log('Successful: ' + successCount);
    console.log('Failed: ' + results.filter(r => r.status === 'error').length);
    console.log('Pending: ' + results.filter(r => r.status === 'pending').length);

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
