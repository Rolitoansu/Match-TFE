import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'postgres',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
})

export const query = (text: string, params?: any[]) => pool.query(text, params)