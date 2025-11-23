import {drizzle} from "drizzle-orm/node-postgres";
import {Pool} from "pg";
import {DATABASE_URL} from "../config/env.js";

const pool = new Pool({
  connectionString: DATABASE_URL,
});
const db = drizzle({client: pool});

export {db, pool};
