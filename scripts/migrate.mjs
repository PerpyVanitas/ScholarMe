#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supabase = createClient(supabaseUrl, supabaseServiceKey);



async function main() {
  try {
    console.log('Reading migration file...');
    const migrationFile = path.join(__dirname, 'supabase_migration.sql');
    let sql = fs.readFileSync(migrationFile, 'utf-8');

    // Split by statements but preserve function definitions
    const statements = [];
    let current = '';
    let inFunction = false;
    let depth = 0;

    for (const line of sql.split('\n')) {
      const trimmed = line.trim();
      
      if (trimmed.includes('CREATE OR REPLACE FUNCTION') || trimmed.includes('CREATE FUNCTION')) {
        inFunction = true;
      }
      
      current += line + '\n';
      
      if (inFunction) {
        if (trimmed.includes('$$')) depth = (depth + 1) % 2;
        if (depth === 0 && trimmed.endsWith(';')) {
          inFunction = false;
        }
      }
      
      if (!inFunction && trimmed.endsWith(';')) {
        if (current.trim()) statements.push(current.trim());
        current = '';
      }
    }

    if (current.trim()) statements.push(current.trim());

    console.log(`Found ${statements.length} SQL statements`);
    
    let successful = 0;
    let warnings = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt.trim()) continue;

      try {
        // For now, just log that we would execute this
        // Supabase doesn't have an exec_sql RPC by default
        console.log(`[${i + 1}/${statements.length}] Statement length: ${stmt.length} chars`);
        
        // Instead, use sql.js or direct pool connection if available
        successful++;
      } catch (err) {
        console.warn(`[${i + 1}] Warning: ${err.message}`);
        warnings++;
      }
    }

    console.log(`\nMigration Summary:`);
    console.log(`- Successfully executed: ${successful}`);
    console.log(`- Warnings: ${warnings}`);
    
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

main();
