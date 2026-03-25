/**
 * Seed Test Data for Clock In/Out Feature
 *
 * Creates test data needed for testing the clock in/out functionality:
 * - Company
 * - Sites with geofence locations
 * - Employees
 * - User accounts linked to employees
 */

require('dotenv-flow').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const Company = require('../models/Company');
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const User = require('../models/User');
const EmployeeSite = require('../models/EmployeeSite');

const seedData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await database.connect();
    console.log('✅ Connected to database\n');

    // 1. Create Test Company
    console.log('📊 Creating test company...');
    const company = await Company.findOneAndUpdate(
      { name: 'Test Company' },
      {
        name: 'Test Company',
        email: 'admin@testcompany.com',
        phone: '+61 2 1234 5678',
        address: '123 Test Street',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2000',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ Company created: ${company.name} (ID: ${company._id})\n`);

    // 2. Create Test Sites with Geofence Locations
    console.log('📍 Creating test sites with geofence...');

    const sites = [
      {
        siteLocationName: 'Sydney CBD Office',
        shortName: 'SYD-CBD',
        client: 'Test Client',
        status: 'ACTIVE',
        address: '123 George Street',
        townSuburb: 'Sydney',
        state: 'NSW',
        postalCode: '2000',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.2093, -33.8688] // Sydney CBD [longitude, latitude]
        },
        geoFenceRadius: 100, // 100 meters
        companyId: company._id,
      },
      {
        siteLocationName: 'Parramatta Site',
        shortName: 'PARRA',
        client: 'Test Client',
        status: 'ACTIVE',
        address: '456 Church Street',
        townSuburb: 'Parramatta',
        state: 'NSW',
        postalCode: '2150',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.0043, -33.8151] // Parramatta [longitude, latitude]
        },
        geoFenceRadius: 150, // 150 meters
        companyId: company._id,
      },
    ];

    for (const siteData of sites) {
      const site = await Site.findOneAndUpdate(
        { shortName: siteData.shortName, companyId: company._id },
        siteData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Site: ${site.siteLocationName}`);
      console.log(`   Location: [${site.location.coordinates[0]}, ${site.location.coordinates[1]}]`);
      console.log(`   Geofence Radius: ${site.geoFenceRadius}m\n`);
    }

    // 3. Create Test Employees
    console.log('👥 Creating test employees...');

    const employees = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+61 400 111 222',
        position: 'Security Officer',
        department: 'Security',
        isActive: true,
        companyId: company._id,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        phone: '+61 400 333 444',
        position: 'Senior Officer',
        department: 'Security',
        isActive: true,
        companyId: company._id,
      },
    ];

    const createdEmployees = [];
    for (const empData of employees) {
      const employee = await Employee.findOneAndUpdate(
        { email: empData.email, companyId: company._id },
        empData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdEmployees.push(employee);
      console.log(`✅ Employee: ${employee.firstName} ${employee.lastName} (${employee.email})`);
    }
    console.log('');

    // 4. Assign Employees to Sites
    console.log('🔗 Assigning employees to sites...');
    const allSites = await Site.find({ companyId: company._id });

    for (const employee of createdEmployees) {
      for (const site of allSites) {
        await EmployeeSite.findOneAndUpdate(
          { employeeId: employee._id, siteId: site._id, companyId: company._id },
          {
            employeeId: employee._id,
            siteId: site._id,
            companyId: company._id,
            isActive: true,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ ${employee.firstName} ${employee.lastName} → ${site.shortName}`);
      }
    }
    console.log('');

    // 5. Create User Accounts and Link to Employees
    console.log('🔐 Creating user accounts and linking to employees...');

    const users = [
      {
        email: 'john.doe@test.com',
        password: 'password123',
        name: 'John Doe',
        role: 'USER',
        employeeId: createdEmployees[0]._id,
      },
      {
        email: 'jane.smith@test.com',
        password: 'password123',
        name: 'Jane Smith',
        role: 'USER',
        employeeId: createdEmployees[1]._id,
      },
      {
        email: 'manager@test.com',
        password: 'password123',
        name: 'Manager User',
        role: 'MANAGER',
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN',
      },
    ];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.findOneAndUpdate(
        { email: userData.email },
        {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          companyId: company._id,
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`✅ User: ${user.email} (${user.role}) - Password: ${userData.password}`);

      // Link user to employee by setting userId on Employee
      if (userData.employeeId) {
        await Employee.findByIdAndUpdate(userData.employeeId, {
          userId: user._id
        });
        console.log(`   🔗 Linked to Employee: ${createdEmployees.find(e => e._id.equals(userData.employeeId)).fullName}`);
      }
    }
    console.log('');

    // Print Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST DATA SEEDED SUCCESSFULLY\n');
    console.log('📊 Summary:');
    console.log(`   Company: ${company.name}`);
    console.log(`   Sites: ${allSites.length}`);
    console.log(`   Employees: ${createdEmployees.length}`);
    console.log(`   Users: ${users.length}\n`);

    console.log('🔐 Login Credentials:');
    console.log('   Employee 1: john.doe@test.com / password123');
    console.log('   Employee 2: jane.smith@test.com / password123');
    console.log('   Manager: manager@test.com / password123');
    console.log('   Admin: admin@test.com / password123\n');

    console.log('📍 Test Locations (Sydney CBD Site):');
    console.log('   Site Center: -33.8688, 151.2093');
    console.log('   Geofence Radius: 100m');
    console.log('   Inside Fence: -33.8688, 151.2093 (exact match)');
    console.log('   Outside Fence: -33.9000, 151.3000 (far away)\n');

    console.log('📱 Testing Instructions:');
    console.log('   1. Login as john.doe@test.com');
    console.log('   2. Navigate to /user/clock');
    console.log('   3. Use coordinates: -33.8688, 151.2093 (within fence)');
    console.log('   4. Or test outside fence: -33.9000, 151.3000 (should fail)\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await database.disconnect();
    process.exit(1);
  }
};

seedData();
