import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg

export const dbClient = () => {

    const user = process.env.DB_USER 
    const password = process.env.DB_PASSWORD
    const db = process.env.DB_NAME
    const host = process.env.DB_HOST
    const port = process.env.DB_PORT
    const connectionString = `postgres://${user}:${password}@${host}:${port}/${db}`
    
    if (!connectionString) {
        throw new Error('DATABASE_URL is missing in environment variables')
    }

    const pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
    })

    return drizzle(pool, { schema })
}

export * from './schema'