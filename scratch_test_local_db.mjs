import pg from "pg";

const client = new pg.Client({
  connectionString: "postgresql://postgres:postgres@localhost:5432/scholarme"
});

async function run() {
  try {
    console.log("Connecting to local postgres...");
    await client.connect();
    console.log("Connected to local database!");
    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");
    console.log("Tables:", res.rows.map(r => r.tablename));
  } catch (err) {
    console.error("Local PG connection failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
