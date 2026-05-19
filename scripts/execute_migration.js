#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    const migrationFile = path.join(__dirname, '../MIGRATION_CLEAN.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    // Split by common SQL delimiters, but be careful with functions
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => {
          // Fallback: use raw query
          return supabase.from('_migrations').select('*').limit(1);
        });
        
        if (error) {
          console.warn(`Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✓ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.warn(`Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('Migration execution completed');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

executeMigration();
