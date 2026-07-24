const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
  });
  
  try {
    await client.connect();
    const res = await client.query(`
      SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck, pol.polpermissive
      FROM pg_policy pol
      JOIN pg_class cls ON pol.polrelid = cls.oid
      WHERE cls.relname = 'profiles';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

test();
