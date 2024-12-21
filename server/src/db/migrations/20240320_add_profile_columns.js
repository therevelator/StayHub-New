export async function up(db) {
  try {
    // Add new columns
    await db.query(`
      ALTER TABLE user_profiles
      ADD COLUMN language VARCHAR(5) DEFAULT 'en',
      ADD COLUMN currency VARCHAR(3) DEFAULT 'USD',
      ADD COLUMN notifications JSON NULL
    `);

    // Set default notifications for existing rows
    await db.query(`
      UPDATE user_profiles 
      SET notifications = JSON_OBJECT('email', true, 'push', false)
      WHERE notifications IS NULL
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(db) {
  try {
    await db.query(`
      ALTER TABLE user_profiles
      DROP COLUMN language,
      DROP COLUMN currency,
      DROP COLUMN notifications
    `);
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
} 