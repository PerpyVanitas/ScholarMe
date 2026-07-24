import * as fs from 'fs';
import * as path from 'path';

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const outputFile = path.join(__dirname, '../docs/schema.md');

function generateSchemaDoc() {
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  let schemaMarkdown = '# Database Schema\n\nThis document is auto-generated from Supabase migrations.\n\n';

  const tables = new Map<string, string[]>();

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    // Naive parsing for CREATE TABLE
    const createTableRegex = /CREATE TABLE IF NOT EXISTS (?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/g;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columns = match[2].split(',\n').map(c => c.trim()).filter(c => c && !c.startsWith('PRIMARY KEY') && !c.startsWith('CONSTRAINT') && !c.startsWith('UNIQUE') && !c.startsWith('FOREIGN KEY'));
      tables.set(tableName, columns);
    }
    
    // Parse drop tables to remove from schema
    const dropTableRegex = /DROP TABLE IF EXISTS (?:public\.)?([a-zA-Z0-9_]+)/g;
    while ((match = dropTableRegex.exec(content)) !== null) {
      tables.delete(match[1]);
    }
  }

  for (const [tableName, columns] of Array.from(tables.entries()).sort()) {
    schemaMarkdown += `## Table: ${tableName}\n\n`;
    schemaMarkdown += '| Column Definition |\n| --- |\n';
    for (const col of columns) {
      schemaMarkdown += `| \`${col.replace(/\|/g, '\\|')}\` |\n`;
    }
    schemaMarkdown += '\n';
  }

  fs.writeFileSync(outputFile, schemaMarkdown, 'utf-8');
  console.log('Schema documentation generated at', outputFile);
}

generateSchemaDoc();
