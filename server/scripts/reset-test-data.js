/**
 * Reset Test Data Script
 * Deletes ALL data and creates fresh test data
 */

const mongoose = require('mongoose');
const path = require('path');

// Load config
require('dotenv-flow').config({
  path: path.join(__dirname, '..'),
  node_env: process.env.NODE_ENV || 'development'
});

const config = require('../src/config');
const Company = require('../src/models/Company');
const User = require('../src/models/User');

async function resetTestData() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(config.database.uri, {
      dbName: config.database.dbName,
      ...config.database.options,
    });
    console.log('✓ Connected to database');

    // Delete all existing data
    console.log('\n🗑️  Deleting all existing data...');
    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('✓ All data deleted');

    // Create test company
    console.log('\n📊 Creating test company...');
    const company = await Company.create({
      name: 'Test Company',
      legalName: 'Test Company Pty Ltd',
      businessNumber: '12345678901',
      email: 'company@test.com',
      phone: '+61400000000',
      address: {
        street: '123 Test Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
      },
      timezone: 'Australia/Sydney',
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
      },
      isActive: true,
      deletedAt: null,
    });
    console.log('✓ Test company created:', company._id);

    // Create test users
    console.log('\n👤 Creating test users...');
    const [user, manager, regularUser] = await Promise.all([
      User.create({
        email: 'admin@test.com',
        password: 'password123',
        name: 'Test Admin',
        role: 'ADMIN',
        companyId: company._id,
        isActive: true,
        deletedAt: null,
      }),
      User.create({
        email: 'manager@test.com',
        password: 'password123',
        name: 'Test Manager',
        role: 'MANAGER',
        companyId: company._id,
        isActive: true,
        deletedAt: null,
      }),
      User.create({
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
        role: 'USER',
        companyId: company._id,
        isActive: true,
        deletedAt: null,
      }),
    ]);
    console.log('✓ Test users created');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✓ Test data reset complete!');
    console.log('='.repeat(60));
    console.log('\n📊 Company:');
    console.log(`   ID: ${company._id}`);
    console.log(`   Name: ${company.name}`);
    console.log('\n👤 Users created:');
    console.log('\n   Admin:');
    console.log(`   Email: admin@test.com`);
    console.log(`   Password: password123`);
    console.log(`   Role: ADMIN`);
    console.log(`   ID: ${user._id}`);
    console.log('\n   Manager:');
    console.log(`   Email: manager@test.com`);
    console.log(`   Password: password123`);
    console.log(`   Role: MANAGER`);
    console.log(`   ID: ${manager._id}`);
    console.log('\n   User:');
    console.log(`   Email: user@test.com`);
    console.log(`   Password: password123`);
    console.log(`   Role: USER`);
    console.log(`   ID: ${regularUser._id}`);
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('✗ Error resetting test data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

resetTestData();
