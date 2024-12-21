export async function up(db) {
  await db.query(`
    ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS notifications JSON NULL
  `);

  // Set default value for existing rows
  await db.query(`
    UPDATE user_profiles 
    SET notifications = '{"email": true, "push": false}'
    WHERE notifications IS NULL
  `);
}

export async function down(db) {
  await db.query(`
    ALTER TABLE user_profiles
    DROP COLUMN language,
    DROP COLUMN currency,
    DROP COLUMN notifications
  `);
} 