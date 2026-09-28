import { defineConfig } from "drizzle-kit";
import { loadEnvFiles } from "./scripts/load-env.mjs";

loadEnvFiles();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
