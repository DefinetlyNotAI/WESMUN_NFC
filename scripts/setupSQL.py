import asyncio
import asyncpg

DATABASE_URL = "INSERT POSTGRESQL CONNECTION SCRIPT HERE"

SQL_AND_MIGRATION = """
-- ========================
-- DB Setup
-- ========================

-- Create roles enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'security', 'overseer', 'admin');
    END IF;
END$$;

-- Create diet enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diet_type') THEN
        CREATE TYPE diet_type AS ENUM ('veg', 'nonveg');
    END IF;
END$$;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name user_role UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('user', 'Standard user with basic access'),
  ('security', 'Can update bags_checked and attendance'),
  ('overseer', 'Read-only access to all user data'),
  ('admin', 'Full access to all features')
ON CONFLICT (name) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  role_id INTEGER REFERENCES roles(id) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bags_checked BOOLEAN DEFAULT FALSE,
  attendance BOOLEAN DEFAULT FALSE,
  received_food BOOLEAN DEFAULT FALSE,
  diet diet_type DEFAULT 'veg',
  allergens TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFC links table
CREATE TABLE IF NOT EXISTS nfc_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_links_uuid ON nfc_links(uuid);
CREATE INDEX IF NOT EXISTS idx_nfc_links_user_id ON nfc_links(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Add optional columns to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approval_status') THEN
        ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approved_by') THEN
        ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='approved_at') THEN
        ALTER TABLE users ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END$$;

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, action, window_start)
);

-- Session tokens table
CREATE TABLE IF NOT EXISTS session_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, action, window_start);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at);

-- Add static user info to audit_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_name') THEN
        ALTER TABLE audit_logs ADD COLUMN actor_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_email') THEN
        ALTER TABLE audit_logs ADD COLUMN actor_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='target_user_name') THEN
        ALTER TABLE audit_logs ADD COLUMN target_user_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='target_user_email') THEN
        ALTER TABLE audit_logs ADD COLUMN target_user_email VARCHAR(255);
    END IF;
END$$;

-- Migrate existing data
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
        print("[WESMUN] Running SQL setup and migration...")
        await conn.execute(SQL_AND_MIGRATION)
        print("[WESMUN] ✓ Database initialized and audit logs migrated successfully!")
    except Exception as e:
        print("[WESMUN] ✗ Error:", e)
        raise
    finally:
        await conn.close()
        print("[WESMUN] Connection closed.")

if __name__ == "__main__":
    asyncio.run(main())
