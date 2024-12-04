import { config } from 'dotenv';

config({ path: './.dev.vars' })

export default {
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
}
