import {Pool} from "pg"
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
}

console.log("[WESMUN] Initializing database pool with URL:", DATABASE_URL?.substring(0, 50) + "...")

// Create connection pool
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('certs/ca.pem').toString(),
    },
})

// Log pool events
pool.on("error", (err) => {
    console.error("[WESMUN] Unexpected error on idle client", err)
})

pool.on("connect", () => {
    console.log("[WESMUN] New client connected to database")
})

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
        console.log("[WESMUN] Executing query:", text.substring(0, 100) + "...", {paramCount: params?.length || 0})

        // noinspection ES6RedundantAwait
        const result = await pool.query(text, params)
        console.log("[WESMUN] Query executed successfully, rows returned:", result.rows.length)

        return result.rows as T[]
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorCode = error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN'
        const errorConstraint = error instanceof Error && 'constraint' in error ? (error as any).constraint : null

        const errorDetails = {
            message: errorMessage,
            code: errorCode,
            constraint: errorConstraint,
            query: text.substring(0, 150),
            paramCount: params?.length || 0,
            timestamp: new Date().toISOString(),
        }

        console.error("[WESMUN] DATABASE ERROR - SQL Query Failed")
        console.error("[WESMUN] Error Code:", errorCode)
        console.error("[WESMUN] Error Message:", errorMessage)
        console.error("[WESMUN] Error Details:", errorDetails)
        console.error("[WESMUN] Query Attempted:", text.substring(0, 150))
        console.error("[WESMUN] Parameters:", params?.length || 0, "params provided")
        console.error("[WESMUN] Full Error Object:", error)

        throw new Error(`[DB-ERROR-${errorCode}] ${errorMessage}`)
    }
}
