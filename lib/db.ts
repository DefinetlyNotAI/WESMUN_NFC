import {Pool} from "pg"
import fs from 'fs';
import path from "path";

let pool: Pool | null = null
let poolInitialized = false

async function initPoolIfNeeded() {
    if (poolInitialized) return
    poolInitialized = true

    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
        console.warn("[WESMUN] DATABASE_URL not set - database queries will fail until a valid DATABASE_URL is provided")
        // Don't throw here - let callers of `query` receive a clear error when they try to use the DB.
        return
    }

    console.log("[WESMUN] Initializing database pool with URL (lazy init)")
    const caPath = path.resolve(process.cwd(), 'certs', 'ca.pem');

    let caContent: string | undefined
    try {
        if (fs.existsSync(caPath)) {
            caContent = fs.readFileSync(caPath, 'utf8')
            console.log("[WESMUN] CA file content loaded from:", caPath)
        } else {
            console.warn("[WESMUN] CA file not found at:", caPath, "- continuing without CA bundle. If your DB requires a CA, add it to the 'certs/ca.pem' path or provide it via env.")
        }
    } catch (err) {
        console.error("[WESMUN] Failed to read CA file:", err)
        caContent = undefined
    }

    const sslConfig = caContent
        ? { rejectUnauthorized: false, ca: caContent }
        : { rejectUnauthorized: false }

    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: sslConfig,
        })
    } catch (err) {
        console.error("[WESMUN] Failed to create database pool:", err)
        pool = null
        return
    }

    // Attach handlers only once
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
            if (pool) await pool.end()
            console.log("[WESMUN] Database pool closed")
        } catch (e) {
            console.error("[WESMUN] Error during pool shutdown", e)
        } finally {
            if (signal) process.exit(0)
        }
    }

    // Register handlers; protect against duplicate attachment in hot-reload/dev
    if (!(process as any).__wesmun_db_handlers_attached) {
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
        ;(process as any).__wesmun_db_handlers_attached = true
    }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
    await initPoolIfNeeded()

    if (!pool) {
        const msg = "DATABASE_NOT_CONFIGURED: Database pool is not available. Check DATABASE_URL and CA file configuration."
        console.error("[WESMUN] ", msg)
        throw new Error(msg)
    }

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
