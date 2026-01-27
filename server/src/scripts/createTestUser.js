/**
 * Create Test User Script
 *
 * Creates a test admin user for development/testing
 * Run: node src/scripts/createTestUser.js
 */

const mongoose = require('mongoose');
require('dotenv-flow').config();
const User = require('../models/User');
const Company = require('../models/Company');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME
    });
    console.log('✓ Connected to MongoDB');

    // Create or get test company
    let company = await Company.findOne({ name: 'Test Company' });

    if (!company) {
      console.log('Creating test company...');
      company = await Company.create({
        name: 'Test Company',
        abn: '12345678901',
        contactEmail: 'admin@testcompany.com',
        contactPhone: '0400000000'
      });
      console.log('✓ Test company created');
    } else {
      console.log('✓ Test company already exists');
    }

    // Check if admin user exists
    const existingUser = await User.findOne({ email: 'admin@test.com' });

    if (existingUser) {
      console.log('✓ Admin user already exists');
      console.log('\nTest Admin Credentials:');
      console.log('Email: admin@test.com');
      console.log('Password: adminpass123');
      console.log('Role: ADMIN');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const user = await User.create({
      email: 'admin@test.com',
      password: 'adminpass123',
      name: 'Admin User',
      role: 'ADMIN',
      companyId: company._id,
      isActive: true
    });

    console.log('✓ Admin user created successfully!');
    console.log('\nTest Admin Credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: adminpass123');
    console.log('Role: ADMIN');
    console.log('\nYou can now log in with these credentials.');

    // Create a regular user as well
    const existingRegularUser = await User.findOne({ email: 'user@test.com' });

    if (!existingRegularUser) {
      await User.create({
        email: 'user@test.com',
        password: 'userpass123',
        name: 'Regular User',
        role: 'USER',
        companyId: company._id,
        isActive: true
      });
      console.log('\n✓ Regular user created');
      console.log('\nTest User Credentials:');
      console.log('Email: user@test.com');
      console.log('Password: userpass123');
      console.log('Role: USER');
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error creating test user:', error.message);
    process.exit(1);
  }
};

createTestUser();
