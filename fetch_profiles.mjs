import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) {
    env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

async function test() {
  const q = `
    SELECT column_name, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'profiles';
  `;
  // I can't run raw SQL easily via REST without RPC.
  // I'll update a test profile to see what happens.
  
  const updateData = {
    first_name: "Van Woodroe",
    last_name: "Perpetua",
    full_name: "Van Woodroe Perpetua",
    phone_number: "+63908 233 9252",
    birthdate: "2003-06-14",
    date_of_birth: "2003-06-14",
    membership_number: "22-0205-906",
    degree_program: null,
    year_level: null,
    profile_completed: true,
  }

  const res = await fetch(`${url}/rest/v1/profiles?id=eq.6869f99a-b430-48f1-a627-64529a803469`, {
    method: 'PATCH',
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(updateData)
  });
  console.log(await res.json());
}
test();
