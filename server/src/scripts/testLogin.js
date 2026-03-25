/**
 * Test Login Script
 * Tests if the user exists and password comparison works
 */

const mongoose = require('mongoose');
require('dotenv-flow').config();
const User = require('../models/User');

const testLogin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME
    });
    console.log('✓ Connected to MongoDB\n');

    // Test credentials
    const testEmail = 'admin@test.com';
    const testPassword = 'adminpass123';

    // Find user WITHOUT password
    console.log('1. Finding user without password field...');
    const userWithoutPassword = await User.findOne({ email: testEmail, isActive: true });
    console.log('   User found:', !!userWithoutPassword);
    if (userWithoutPassword) {
      console.log('   User ID:', userWithoutPassword._id);
      console.log('   Email:', userWithoutPassword.email);
      console.log('   Role:', userWithoutPassword.role);
      console.log('   CompanyId:', userWithoutPassword.companyId);
      console.log('   Has password field:', !!userWithoutPassword.password);
    }

    console.log('\n2. Finding user WITH password field (.select("+password"))...');
    const user = await User.findOne({ email: testEmail, isActive: true }).select('+password');
    console.log('   User found:', !!user);

    if (!user) {
      console.log('   ✗ User not found!');
      await mongoose.connection.close();
      return;
    }

    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   CompanyId:', user.companyId);
    console.log('   Has password field:', !!user.password);
    console.log('   Password hash (first 20 chars):', user.password ? user.password.substring(0, 20) + '...' : 'MISSING');

    // Test password comparison
    console.log('\n3. Testing password comparison...');
    if (!user.password) {
      console.log('   ✗ Password field is missing! Cannot compare.');
    } else {
      const isValid = await user.comparePassword(testPassword);
      console.log('   Password "' + testPassword + '" is valid:', isValid);

      if (isValid) {
        console.log('\n✓ Login test PASSED! Credentials are correct.');
      } else {
        console.log('\n✗ Login test FAILED! Password does not match.');

        // Try comparing with wrong password
        const wrongPasswordTest = await user.comparePassword('wrongpassword');
        console.log('   Wrong password test (should be false):', wrongPasswordTest);
      }
    }

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testLogin();
