const sequelize = require('./server/src/config/database');
const { QueryTypes } = require('sequelize');

async function fixTable() {
  try {
    console.log('Attempting to add image_url column to events table...');
    await sequelize.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url LONGTEXT AFTER venue;');
    console.log('✅ Column image_url added successfully (or already exists).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add column:', err.message);
    process.exit(1);
  }
}

fixTable();
