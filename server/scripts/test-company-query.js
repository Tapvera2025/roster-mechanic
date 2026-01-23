/**
 * Test Company Query
 * Test if Company.find() works with soft delete plugin
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env
require('dotenv-flow').config({
  path: path.join(__dirname, '..'),
  node_env: process.env.NODE_ENV || 'development'
});

const Company = require('../src/models/Company');

async function testQuery() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'roster_mechanic_dev',
    });
    console.log('✓ Connected\n');

    // Test 1: Raw MongoDB query
    console.log('=== Test 1: Raw MongoDB Query ===');
    const db = mongoose.connection.db;
    const rawCompanies = await db.collection('companies').find({}).toArray();
    console.log(`Raw query found: ${rawCompanies.length} companies`);
    rawCompanies.forEach(c => {
      console.log(`  - ${c._id} | ${c.name} | deletedAt: ${c.deletedAt}`);
    });

    // Test 2: Mongoose Company.find()
    console.log('\n=== Test 2: Company.find({}) ===');
    const companies = await Company.find({}).lean();
    console.log(`Company.find() found: ${companies.length} companies`);
    companies.forEach(c => {
      console.log(`  - ${c._id} | ${c.name} | deletedAt: ${c.deletedAt}`);
    });

    // Test 3: Company.countDocuments()
    console.log('\n=== Test 3: Company.countDocuments({}) ===');
    const count = await Company.countDocuments({});
    console.log(`Count: ${count}`);

    // Test 4: Company.findWithDeleted()
    console.log('\n=== Test 4: Company.findWithDeleted({}) ===');
    const allCompanies = await Company.findWithDeleted({}).lean();
    console.log(`findWithDeleted() found: ${allCompanies.length} companies`);
    allCompanies.forEach(c => {
      console.log(`  - ${c._id} | ${c.name} | deletedAt: ${c.deletedAt}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Done');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
