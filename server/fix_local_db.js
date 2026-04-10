const sequelize = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function fixTable() {
  try {
    console.log('Attempting to add image_url column to events table...');
    // Check if column exists first (some MySQL versions don't support IF NOT EXISTS for ADD COLUMN)
    const [results] = await sequelize.query("SHOW COLUMNS FROM events LIKE 'image_url'");
    
    if (results.length === 0) {
      await sequelize.query('ALTER TABLE events ADD COLUMN image_url LONGTEXT AFTER venue;');
      console.log('✅ Column image_url added successfully.');
    } else {
      console.log('ℹ️ Column image_url already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix table:', err.message);
    process.exit(1);
  }
}

fixTable();
