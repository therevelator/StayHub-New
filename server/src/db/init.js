// Loads a .sql file into the configured PostgreSQL database. Defaults to schema.sql.
//   npm run db:init --prefix server    -> loads schema.sql (creates tables)
//   npm run db:seed --prefix server    -> loads seed-demo.sql (demo data)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const file = process.argv[2] || 'schema.sql';
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const database = process.env.DB_NAME || 'stayhub';

  const client = new pg.Client(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || process.env.USER || 'postgres',
          password: process.env.DB_PASSWORD || undefined,
          database,
        }
  );

  await client.connect();
  console.log(`Loading ${file} into "${database}" ...`);
  await client.query(sql);
  await client.end();
  console.log(`${file} loaded ✅`);
};

run().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
