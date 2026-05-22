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
  const res = await fetch(`${url}/rest/v1/rpc/get_policies?table_name=profiles`, {
    method: 'POST',
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  console.log(await res.text());
}
test();
