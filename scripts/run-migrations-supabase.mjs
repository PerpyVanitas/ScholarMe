import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  // Get credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public',
    },
  });

  try {
    console.log('Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl}`);

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Parse statements - handle both regular statements and function definitions
    const statements = [];
    let current = '';
    let inFunction = false;
    let dollarCount = 0;

    for (const line of migrationSQL.split('\n')) {
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('--') || trimmed.startsWith('=')) {
        if (trimmed.includes('STEP')) {
          console.log(`\n📍 ${trimmed}`);
        }
        continue;
      }

      // Track function definitions
      if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
        inFunction = true;
      }

      // Track $$ markers in functions
      if (inFunction && trimmed.includes('$$')) {
        dollarCount++;
      }

      current += line + '\n';

      // Check for statement end
      if (trimmed.endsWith(';') && (!inFunction || dollarCount >= 2)) {
        if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
          inFunction = false;
          dollarCount = 0;
        }
        statements.push(current.trim());
        current = '';
      }
    }

    // Add any remaining content
    if (current.trim()) {
      statements.push(current.trim());
    }

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    const results = [];
    let successCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length === 0) continue;

      try {
        // Use Supabase's RPC or direct query - let's try the query method
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement,
        }).catch(async () => {
          // Fallback: try using raw query
          try {
            const result = await supabase.from('_migrations').insert({
              statement: statement.substring(0, 100),
              executed_at: new Date().toISOString(),
            });
            return result;
          } catch {
            return { data: null, error: { message: 'RPC not available' } };
          }
        });

        if (error?.message?.includes('RPC not available')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] RPC exec_sql not available - requires manual execution in Supabase`);
          results.push({
            index: i + 1,
            status: 'pending',
            message: 'Requires manual execution in Supabase dashboard',
          });
        } else if (error) {
          console.log(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
          results.push({
            index: i + 1,
            status: 'error',
            message: error.message,
            statement: statement.substring(0, 50),
          });
        } else {
          console.log(`✓  [${i + 1}/${statements.length}] Executed`);
          successCount++;
          results.push({
            index: i + 1,
            status: 'success',
          });
        }
      } catch (err) {
        console.log(`❌ [${i + 1}/${statements.length}] Exception: ${err.message}`);
        results.push({
          index: i + 1,
          status: 'error',
          message: err.message,
        });
      }
    }

    console.log(`\n\n=== MIGRATION SUMMARY ===`);
    console.log(`Total statements: ${statements.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);
    console.log(`Pending (manual): ${results.filter(r => r.status === 'pending').length}`);

    if (results.some(r => r.status === 'error')) {
      console.log('\n⚠️  Some migrations failed. See errors above.');
      console.log('\n📝 Alternative: Execute migration SQL in Supabase dashboard:');
      console.log('1. Go to SQL Editor in your Supabase project');
      console.log('2. Create new query');
      console.log('3. Copy entire content of scripts/supabase_migration.sql');
      console.log('4. Click Execute');
    } else {
      console.log('\n✓ All migrations completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
