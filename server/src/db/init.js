// Loads a .sql file into the configured MySQL. Defaults to schema.sql.
//   npm run db:init --prefix server    -> loads schema.sql (creates tables)
//   npm run db:seed --prefix server    -> loads seed-demo.sql (demo data)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const file = process.argv[2] || 'schema.sql';
  const schemaPath = path.join(__dirname, file);
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stayhub',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  });

  console.log(`Loading ${file} into "${process.env.DB_NAME || 'stayhub'}" ...`);
  await conn.query(schema);
  await conn.end();
  console.log(`${file} loaded ✅`);
};

run().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
