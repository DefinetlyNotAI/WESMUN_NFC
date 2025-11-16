import asyncio
import asyncpg

DATABASE_URL = "INSERT POSTGRESQL CONNECTION SCRIPT HERE"

MIGRATION_SQL = """
-- Add columns to store user details statically in audit logs
-- This prevents data loss when users are deleted

DO $$
BEGIN
    -- Add actor details columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='audit_logs' AND column_name='actor_name'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN actor_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='audit_logs' AND column_name='actor_email'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN actor_email VARCHAR(255);
    END IF;

    -- Add target user details columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='audit_logs' AND column_name='target_user_name'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN target_user_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='audit_logs' AND column_name='target_user_email'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN target_user_email VARCHAR(255);
    END IF;
END$$;

-- Migrate existing data from foreign key relations to static fields
UPDATE audit_logs al
SET
    actor_name = u.name,
    actor_email = u.email
FROM users u
WHERE al.actor_id = u.id AND al.actor_name IS NULL;

UPDATE audit_logs al
SET
    target_user_name = u.name,
    target_user_email = u.email
FROM users u
WHERE al.target_user_id = u.id AND al.target_user_name IS NULL;
"""

async def main():
    print("[WESMUN] Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        print("[WESMUN] Running migration to add static user details to audit logs...")
        await conn.execute(MIGRATION_SQL)
        print("[WESMUN] ✓ Migration completed successfully!")
        print("[WESMUN] ✓ Added actor_name, actor_email, target_user_name, target_user_email columns")
        print("[WESMUN] ✓ Migrated existing audit log data")
    except Exception as e:
        print(f"[WESMUN] ✗ Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("[WESMUN] Database connection closed")

if __name__ == "__main__":
    asyncio.run(main())

