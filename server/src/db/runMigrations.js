import db from './index.js';
import * as addProfileColumns from './migrations/20240320_add_profile_columns.js';

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Run the add profile columns migration
    console.log('Running add profile columns migration...');
    await addProfileColumns.up(db);
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 