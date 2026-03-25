/**
 * Generate JWT Token Script
 * Generates a JWT token for API testing
 */

const jwt = require('jsonwebtoken');
const path = require('path');

// Load config
require('dotenv-flow').config({
  path: path.join(__dirname, '..'),
  node_env: process.env.NODE_ENV || 'development'
});

const config = require('../src/config');

// Test users from reset script
const users = {
  admin: {
    userId: '6973410c88b5d1a11c2874cf',
    email: 'admin@test.com',
    companyId: '6973410c88b5d1a11c2874cb',
    role: 'ADMIN',
    name: 'Test Admin'
  },
  manager: {
    userId: '6973410c88b5d1a11c2874d0',
    email: 'manager@test.com',
    companyId: '6973410c88b5d1a11c2874cb',
    role: 'MANAGER',
    name: 'Test Manager'
  },
  user: {
    userId: '6973410c88b5d1a11c2874d1',
    email: 'user@test.com',
    companyId: '6973410c88b5d1a11c2874cb',
    role: 'USER',
    name: 'Test User'
  }
};

function generateToken(userType) {
  const userData = users[userType];
  if (!userData) {
    console.error(`Invalid user type. Use: admin, manager, or user`);
    process.exit(1);
  }

  const token = jwt.sign(userData, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });

  return token;
}

// Get user type from command line args
const userType = process.argv[2] || 'admin';

console.log('\n' + '='.repeat(60));
console.log('JWT Token Generator');
console.log('='.repeat(60));

const token = generateToken(userType);

console.log(`\nUser Type: ${userType.toUpperCase()}`);
console.log(`Email: ${users[userType].email}`);
console.log(`Role: ${users[userType].role}`);
console.log(`Company ID: ${users[userType].companyId}`);
console.log(`User ID: ${users[userType].userId}`);

console.log('\nJWT Token (use in Authorization: Bearer <token>):');
console.log('='.repeat(60));
console.log(token);
console.log('='.repeat(60));

console.log('\n✓ Copy the token above and use it in your API requests');
console.log('  Example: Authorization: Bearer ' + token);
console.log('\n' + '='.repeat(60));
