#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✓ Connected');

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

      // End of statement
      if (trimmed.endsWith(';') && !inFunction) {
        const stmt = current.trim();
        if (stmt) {
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

    console.log(`\n📊 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const stmtType = stmt.split(/\s+/)[0].toUpperCase();
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

      try {
        await client.query(stmt);
        successCount++;
        console.log(`✓ [${i + 1}/${statements.length}] ${stmtType} - ${preview}...`);
      } catch (err) {
        errorCount++;
        const errorMsg = err.message.split('\n')[0];
        console.log(`✗ [${i + 1}/${statements.length}] ${stmtType} - ${errorMsg}`);
        errors.push({ index: i + 1, type: stmtType, message: errorMsg });
      }
    }

    console.log(`\n📋 Migration Summary:`);
    console.log(`   ✓ Successful: ${successCount}/${statements.length}`);
    console.log(`   ✗ Failed: ${errorCount}/${statements.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors:`);
      errors.forEach(({ index, type, message }) => {
        console.log(`   [${index}] ${type}: ${message}`);
      });
    }

    console.log(`\n✨ Migration execution completed!`);

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
