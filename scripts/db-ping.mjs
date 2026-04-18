import "dotenv/config";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url || url.includes("ep-xxxx")) {
  console.error(
    "Set DATABASE_URL in .env to your real Neon URI (not the placeholder).\n" +
      "Neon console → your project → Connection details → copy URI (pooled).",
  );
  process.exit(1);
}

const useSsl =
  process.env.DATABASE_SSL !== "false" &&
  (url.includes("sslmode=require") ||
    url.includes("sslmode=verify-full") ||
    /neon\.tech/i.test(url));

const pool = new pg.Pool({
  connectionString: url,
  max: 1,
  connectionTimeoutMillis: 15_000,
  ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
});

try {
  const { rows } = await pool.query("select current_database() as db, version() as v");
  console.log("Connected to Neon/Postgres:", rows[0]?.db);
  console.log(rows[0]?.v?.split(" ")?.slice(0, 2)?.join(" ") ?? "");
} catch (err) {
  console.error("Connection failed:", err.message);
  console.error(
    "\nTips: use sslmode=require in the URL; URL-encode special characters in the password;",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
