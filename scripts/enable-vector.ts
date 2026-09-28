import { neon } from "@neondatabase/serverless";
import { loadEnvFiles } from "./load-env.mjs";

loadEnvFiles();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env.local first.");
  process.exit(1);
}

const sql = neon(databaseUrl);
await sql`CREATE EXTENSION IF NOT EXISTS vector`;
console.log("pgvector extension is ready");
