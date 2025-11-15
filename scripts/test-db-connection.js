const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' }); // loads .env.local
const fs = require('fs');
const path = require('path');
const DATABASE_URL = process.env.DATABASE_URL;
console.log(`DATABASE_URL: ${DATABASE_URL}`);

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: true, // Allow self-signed certificates
        ca: fs.readFileSync(path.resolve(process.cwd(), '..' , 'certs', 'ca.pem'), 'utf8'),
    },
});

(async () => {
    try {
        console.log("Testing database connection...");
        const client = await pool.connect();
        console.log("Connection successful!");
        client.release();
    } catch (error) {
        console.error("Connection failed:", error);
    } finally {
        await pool.end();
    }
})();
