import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: './.env' })

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  }
}
