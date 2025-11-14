import asyncio
import asyncpg

DATABASE_URL = "INSERT POSTGRESQL CONNECTION SCRIPT HERE"

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("[WESMUN] Fetching tables...")
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
              AND table_type='BASE TABLE'
            ORDER BY table_name;
        """)
        
        if not tables:
            print("[WESMUN] No tables found.")
            return
        
        for table in tables:
            table_name = table['table_name']
            # Optionally get row count
            row_count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')
            print(f"[WESMUN] Table: {table_name}, Rows: {row_count}")
    finally:
        await conn.close()
        print("[WESMUN] Connection closed.")

if __name__ == "__main__":
    asyncio.run(main())
