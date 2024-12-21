import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'alter_host_id_type.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Run the migration
    await db.query(migration);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
};

runMigration();
