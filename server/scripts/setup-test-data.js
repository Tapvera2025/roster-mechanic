/**
 * Setup Test Data Script
 * Creates a test company and admin user for API testing
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

async function setupTestData() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(config.database.uri, {
      dbName: config.database.dbName,
      ...config.database.options,
    });
    console.log('✓ Connected to database');

    // 1. Create test company
    console.log('\n📊 Creating test company...');
    const companies = await Company.findWithDeleted({ name: 'Test Company' }).limit(1).exec();
    let company = companies[0];

    if (company) {
      console.log('✓ Test company already exists - ensuring deletedAt is null');
      // Ensure deletedAt is null for proper soft delete behavior
      await Company.updateOne({ _id: company._id }, { deletedAt: null });
    } else {
      company = await Company.create({
        name: 'Test Company',
        legalName: 'Test Company Pty Ltd',
        businessNumber: '12345678901', // ABN
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
      });
      console.log('✓ Test company created:', company._id);
    }

    // 2. Create test admin user
    console.log('\n👤 Creating test admin user...');
    const users = await User.findWithDeleted({ email: 'admin@test.com' }).limit(1).exec();
    let user = users[0];

    if (user) {
      console.log('✓ Test admin user already exists - ensuring deletedAt is null');
      await User.updateOne({ _id: user._id }, { deletedAt: null });
    } else {
      user = await User.create({
        email: 'admin@test.com',
        password: 'password123', // Will be auto-hashed by pre-save hook
        name: 'Test Admin',
        role: 'ADMIN',
        companyId: company._id,
        isActive: true,
      });
      console.log('✓ Test admin user created:', user._id);
    }

    // 3. Create test manager user
    console.log('\n👤 Creating test manager user...');
    const managers = await User.findWithDeleted({ email: 'manager@test.com' }).limit(1).exec();
    let manager = managers[0];

    if (manager) {
      console.log('✓ Test manager user already exists - ensuring deletedAt is null');
      await User.updateOne({ _id: manager._id }, { deletedAt: null });
    } else{
      manager = await User.create({
        email: 'manager@test.com',
        password: 'password123',
        name: 'Test Manager',
        role: 'MANAGER',
        companyId: company._id,
        isActive: true,
      });
      console.log('✓ Test manager user created:', manager._id);
    }

    // 4. Create test regular user
    console.log('\n👤 Creating test regular user...');
    const regularUsers = await User.findWithDeleted({ email: 'user@test.com' }).limit(1).exec();
    let regularUser = regularUsers[0];

    if (regularUser) {
      console.log('✓ Test regular user already exists - ensuring deletedAt is null');
      await User.updateOne({ _id: regularUser._id }, { deletedAt: null });
    } else {
      regularUser = await User.create({
        email: 'user@test.com',
        password: 'password123',
        name: 'Test User',
        role: 'USER',
        companyId: company._id,
        isActive: true,
      });
      console.log('✓ Test regular user created:', regularUser._id);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✓ Test data setup complete!');
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
    console.error('✗ Error setting up test data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

setupTestData();
