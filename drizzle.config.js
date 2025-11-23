import {defineConfig} from "drizzle-kit";
import {DATABASE_URL} from "./config/env.js";

export default defineConfig({
  out: "./drizzle",
  schema: "./drizzle/schema/schema.js",
  migrations: {
    out: "./drizzle/migrations",
  },
  verbose: true,
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
