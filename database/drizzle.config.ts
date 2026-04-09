import { defineConfig } from 'drizzle-kit'

const host = process.env.DB_HOST || 'postgres'
const port = Number(process.env.DB_PORT || 5432)

export default defineConfig({
  dialect: 'postgresql',
  schema: './schema.ts',
  dbCredentials: {
    host,
    port,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    ssl: false,
  },
})