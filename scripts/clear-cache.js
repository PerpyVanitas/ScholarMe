import { rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '..');

// 1. Nuke .next directory
const nextDir = join(root, '.next');
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log('Deleted .next directory');
} else {
  console.log('.next directory does not exist');
}

// 2. Verify server.ts content
const serverTs = join(root, 'lib', 'supabase', 'server.ts');
if (existsSync(serverTs)) {
  const content = readFileSync(serverTs, 'utf8');
  console.log('server.ts exists, first 200 chars:');
  console.log(content.substring(0, 200));
  console.log('---');
  console.log('Contains block comment:', content.includes('/*'));
  console.log('Contains PROVIDES TWO:', content.includes('PROVIDES TWO'));
  console.log('Contains app/api/', content.includes('app/api/'));
} else {
  console.log('server.ts DOES NOT EXIST');
}

// 3. Verify create-client.ts content
const createClient = join(root, 'lib', 'supabase', 'create-client.ts');
if (existsSync(createClient)) {
  const content = readFileSync(createClient, 'utf8');
  console.log('\ncreate-client.ts exists, first 200 chars:');
  console.log(content.substring(0, 200));
} else {
  console.log('create-client.ts DOES NOT EXIST');
}
