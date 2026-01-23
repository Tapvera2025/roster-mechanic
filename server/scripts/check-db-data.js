/**
 * Check Database Data
 * Simple script to verify data exists in database
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env
require('dotenv-flow').config({
  path: path.join(__dirname, '..'),
  node_env: process.env.NODE_ENV || 'development'
});

async function checkData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'roster_mechanic_dev',
    });
    console.log('✓ Connected\n');

    const db = mongoose.connection.db;

    // Check companies
    const companies = await db.collection('companies').find({}).toArray();
    console.log(`Companies found: ${companies.length}`);
    companies.forEach(c => {
      console.log(`  - ${c._id} | ${c.name} | deletedAt: ${c.deletedAt}`);
    });

    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nUsers found: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u._id} | ${u.email} | ${u.role} | deletedAt: ${u.deletedAt}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Done');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
