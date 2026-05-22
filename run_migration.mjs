import fs from 'fs';
import { Client } from 'pg';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) {
    env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
});

const dbUrl = env['DATABASE_URL'] || env['SUPABASE_DB_URL'];

async function test() {
  if (!dbUrl) {
    console.error("No DATABASE_URL found");
    return;
  }
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  
  const sql = `
-- Restore User Policies on hs_designations
CREATE POLICY "Users can insert own designations"
  ON public.hs_designations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designations"
  ON public.hs_designations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own designations"
  ON public.hs_designations FOR DELETE
  USING (auth.uid() = user_id);
  `;
  
  try {
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Error executing migration:", err);
  } finally {
    await client.end();
  }
}
test();
