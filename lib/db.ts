import {Pool} from "pg"
import fs from 'fs';
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
}

console.log("[WESMUN] Initializing database pool with URL")
const caPath = path.resolve(process.cwd(), 'certs', 'ca.pem');

// Read CA file content
const caContent = fs.readFileSync(caPath, 'utf8');
console.log("[WESMUN] CA file content loaded");

// Create connection pool
const pool = new Pool({
    connectionString: DATABASE_URL, // Use the connection string as is from the environment
    ssl: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ca: caContent,
    },
});

// Log pool events and ensure handlers always run; add process-level cleanup
const logPoolError = (err: Error) => {
    console.error("[WESMUN] Unexpected error on idle client", err)
}
pool.on("error", logPoolError)

pool.on("connect", () => {
    console.log("[WESMUN] New client connected to database")
})

// Ensure process-level handlers run and gracefully close the pool
const shutdown = async (signal?: string) => {
    console.log(`[WESMUN] Shutting down${signal ? ` due to ${signal}` : ""}...`)
    try {
        await pool.end()
        console.log("[WESMUN] Database pool closed")
    } catch (e) {
        console.error("[WESMUN] Error during pool shutdown", e)
    } finally {
        if (signal) process.exit(0)
    }
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("uncaughtException", (err) => {
    console.error("[WESMUN] Uncaught Exception", err)
    shutdown().catch(console.error)
})
process.on("unhandledRejection", (reason) => {
    console.error("[WESMUN] Unhandled Rejection", reason)
    shutdown().catch(console.error)
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
