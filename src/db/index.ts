import { neon } from '@neondatabase/serverless';
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from './schema';

const db = (DATABASE_URL: string) => {
    const sql = neon(DATABASE_URL!);
    return drizzle(sql, {schema});
}
export default db;