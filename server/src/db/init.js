// One-time database initializer: loads schema.sql into the configured MySQL.
// Run once after provisioning the database, e.g. on Railway:
//   npm run db:init --prefix server
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stayhub',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  });

  console.log(`Loading schema into "${process.env.DB_NAME || 'stayhub'}" ...`);
  await conn.query(schema);
  await conn.end();
  console.log('Schema loaded ✅');
};

run().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
