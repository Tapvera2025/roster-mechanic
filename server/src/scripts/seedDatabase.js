/**
 * Database Seeding Script
 *
 * Populates the database with dummy data for development/testing
 * Run: node src/scripts/seedDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv-flow').config();
const Company = require('../models/Company');
const User = require('../models/User');
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME
    });
    console.log('✓ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Site.deleteMany({});
    await Employee.deleteMany({});
    await Shift.deleteMany({});
    await Company.deleteMany({});
    console.log('✓ Existing data cleared\n');

    // ====================================
    // 1. CREATE COMPANY
    // ====================================
    console.log('1️⃣  Creating company...');
    const company = await Company.create({
      name: 'SecureGuard Security Services',
      legalName: 'SecureGuard Security Services Pty Ltd',
      businessNumber: '12345678901',
      email: 'info@secureguard.com',
      phone: '+1-416-555-0100',
      address: {
        street: '123 Business Street',
        city: 'Toronto',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia'
      },
      timezone: 'Australia/Sydney',
      settings: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'AUD',
        language: 'en'
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      },
      isActive: true
    });
    console.log(`✓ Company created: ${company.name} (ID: ${company._id})\n`);

    // ====================================
    // 2. CREATE USERS
    // ====================================
    console.log('2️⃣  Creating users...');
    const users = await User.create([
      {
        email: 'admin@secureguard.com',
        password: 'admin123',
        name: 'John Smith',
        role: 'ADMIN',
        companyId: company._id,
        isActive: true
      },
      {
        email: 'manager@secureguard.com',
        password: 'manager123',
        name: 'Sarah Johnson',
        role: 'MANAGER',
        companyId: company._id,
        isActive: true
      },
      {
        email: 'supervisor@secureguard.com',
        password: 'supervisor123',
        name: 'Michael Brown',
        role: 'MANAGER',
        companyId: company._id,
        isActive: true
      },
      {
        email: 'user1@secureguard.com',
        password: 'user1234',
        name: 'Emily Davis',
        role: 'USER',
        companyId: company._id,
        isActive: true
      },
      {
        email: 'user2@secureguard.com',
        password: 'user1234',
        name: 'David Wilson',
        role: 'USER',
        companyId: company._id,
        isActive: true
      }
    ]);
    console.log(`✓ ${users.length} users created\n`);

    // ====================================
    // 3. CREATE SITES
    // ====================================
    console.log('3️⃣  Creating sites...');
    const sites = await Site.create([
      {
        siteLocationName: 'Downtown Shopping Mall',
        shortName: 'DSM-001',
        jobRefNo: 'JOB-DSM-2024-001',
        client: 'Westfield Shopping Centers',
        address: '456 Retail Plaza, Sydney NSW 2000',
        state: 'NSW',
        townSuburb: 'Sydney',
        postalCode: '2000',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.2093, -33.8688] // Sydney coordinates [longitude, latitude]
        },
        geoFenceRadius: 150,
        contactPerson: 'James Anderson',
        contactPosition: 'Security Manager',
        contactPhone: '+61-2-9555-0201',
        contactMobile: '+61-412-345-001',
        contactEmail: 'james@mall.com',
        contactNotes: 'Main entrance requires 24/7 coverage. Check loading dock every hour.',
        defaultStartTime: '09:00',
        defaultEndTime: '21:00',
        defaultShiftDuration: 720,
        flatBillingRate: 45.50,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      },
      {
        siteLocationName: 'Tech Corporate Office',
        shortName: 'TCO-002',
        jobRefNo: 'JOB-TCO-2024-002',
        client: 'TechCorp Australia',
        address: '789 Innovation Drive, North Sydney NSW 2060',
        state: 'NSW',
        townSuburb: 'North Sydney',
        postalCode: '2060',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.2070, -33.8365]
        },
        geoFenceRadius: 100,
        contactPerson: 'Lisa Chen',
        contactPosition: 'Office Manager',
        contactPhone: '+61-2-9555-0202',
        contactMobile: '+61-412-345-002',
        contactEmail: 'lisa@techcorp.com',
        contactNotes: 'Visitor sign-in required. Server room checks every 2 hours.',
        defaultStartTime: '07:00',
        defaultEndTime: '19:00',
        defaultShiftDuration: 720,
        flatBillingRate: 42.00,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      },
      {
        siteLocationName: 'Warehouse & Distribution Center',
        shortName: 'WDC-003',
        jobRefNo: 'JOB-WDC-2024-003',
        client: 'LogisticsPro Pty Ltd',
        address: '321 Industrial Road, Silverwater NSW 2128',
        state: 'NSW',
        townSuburb: 'Silverwater',
        postalCode: '2128',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.0453, -33.8344]
        },
        geoFenceRadius: 200,
        contactPerson: 'Robert Martinez',
        contactPosition: 'Warehouse Manager',
        contactPhone: '+61-2-9555-0203',
        contactMobile: '+61-412-345-003',
        contactEmail: 'robert@warehouse.com',
        contactNotes: '24/7 operation. Patrol perimeter every 30 minutes. Monitor loading bays.',
        defaultStartTime: '00:00',
        defaultEndTime: '23:59',
        defaultShiftDuration: 480,
        flatBillingRate: 48.00,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      },
      {
        siteLocationName: 'Luxury Apartment Complex',
        shortName: 'LAC-004',
        jobRefNo: 'JOB-LAC-2024-004',
        client: 'Harbourside Properties',
        address: '555 Waterfront Boulevard, Darling Harbour NSW 2000',
        state: 'NSW',
        townSuburb: 'Darling Harbour',
        postalCode: '2000',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.1990, -33.8699]
        },
        geoFenceRadius: 120,
        contactPerson: 'Amanda Taylor',
        contactPosition: 'Property Manager',
        contactPhone: '+61-2-9555-0204',
        contactMobile: '+61-412-345-004',
        contactEmail: 'amanda@luxuryapts.com',
        contactNotes: 'Night shift only. Monitor parking garage and lobby. Assist residents as needed.',
        defaultStartTime: '18:00',
        defaultEndTime: '06:00',
        defaultShiftDuration: 720,
        flatBillingRate: 44.00,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      },
      {
        siteLocationName: 'University Campus - West Wing',
        shortName: 'UCW-005',
        jobRefNo: 'JOB-UCW-2024-005',
        client: 'University of Sydney',
        address: '100 College Street, Sydney NSW 2006',
        state: 'NSW',
        townSuburb: 'Sydney',
        postalCode: '2006',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.1873, -33.8886]
        },
        geoFenceRadius: 250,
        contactPerson: 'Dr. Kevin White',
        contactPosition: 'Campus Security Director',
        contactPhone: '+61-2-9555-0205',
        contactMobile: '+61-412-345-005',
        contactEmail: 'kwhite@university.edu.au',
        contactNotes: 'Monitor student residences. Check library and computer labs. Emergency response training required.',
        defaultStartTime: '00:00',
        defaultEndTime: '23:59',
        defaultShiftDuration: 480,
        flatBillingRate: 46.50,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      },
      {
        siteLocationName: 'Hospital Main Campus',
        shortName: 'HMC-006',
        jobRefNo: 'JOB-HMC-2024-006',
        client: 'Sydney General Hospital',
        address: '200 Healthcare Avenue, Camperdown NSW 2050',
        state: 'NSW',
        townSuburb: 'Camperdown',
        postalCode: '2050',
        timezone: 'Australia/Sydney',
        location: {
          type: 'Point',
          coordinates: [151.1813, -33.8894]
        },
        geoFenceRadius: 300,
        contactPerson: 'Dr. Patricia Lee',
        contactPosition: 'Security Coordinator',
        contactPhone: '+61-2-9555-0206',
        contactMobile: '+61-412-345-006',
        contactEmail: 'plee@hospital.com.au',
        contactNotes: '24/7 critical facility. Monitor emergency department. Control visitor access. CPR/First Aid certified only.',
        defaultStartTime: '00:00',
        defaultEndTime: '23:59',
        defaultShiftDuration: 480,
        flatBillingRate: 52.00,
        alertRecipient: 'alerts@secureguard.com',
        status: 'ACTIVE',
        companyId: company._id
      }
    ]);
    console.log(`✓ ${sites.length} sites created\n`);

    // ====================================
    // 4. CREATE EMPLOYEES
    // ====================================
    console.log('4️⃣  Creating employees...');
    const employees = await Employee.create([
      {
        employeeId: 'EMP-001',
        firstName: 'Alex',
        lastName: 'Thompson',
        email: 'alex.thompson@secureguard.com',
        phone: '+1-416-555-1001',
        dateOfBirth: new Date('1995-03-15'),
        hireDate: new Date('2023-01-10'),
        position: 'Senior Security Guard',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 28.50,
        certifications: ['Security Guard License', 'First Aid', 'CPR'],
        emergencyContact: {
          name: 'Maria Thompson',
          relationship: 'Spouse',
          phone: '+1-416-555-1002'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-002',
        firstName: 'Jordan',
        lastName: 'Williams',
        email: 'jordan.williams@secureguard.com',
        phone: '+1-416-555-1003',
        dateOfBirth: new Date('1998-07-22'),
        hireDate: new Date('2023-03-15'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 25.00,
        certifications: ['Security Guard License', 'First Aid'],
        emergencyContact: {
          name: 'Patricia Williams',
          relationship: 'Mother',
          phone: '+1-416-555-1004'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-003',
        firstName: 'Taylor',
        lastName: 'Martinez',
        email: 'taylor.martinez@secureguard.com',
        phone: '+1-416-555-1005',
        dateOfBirth: new Date('1992-11-08'),
        hireDate: new Date('2022-06-01'),
        position: 'Security Supervisor',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 32.00,
        certifications: ['Security Guard License', 'First Aid', 'CPR', 'Supervisor Training'],
        emergencyContact: {
          name: 'Carlos Martinez',
          relationship: 'Father',
          phone: '+1-416-555-1006'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-004',
        firstName: 'Morgan',
        lastName: 'Garcia',
        email: 'morgan.garcia@secureguard.com',
        phone: '+1-416-555-1007',
        dateOfBirth: new Date('1997-05-30'),
        hireDate: new Date('2023-08-20'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'PART_TIME',
        status: 'ACTIVE',
        hourlyRate: 24.00,
        certifications: ['Security Guard License'],
        emergencyContact: {
          name: 'Lisa Garcia',
          relationship: 'Sister',
          phone: '+1-416-555-1008'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-005',
        firstName: 'Casey',
        lastName: 'Rodriguez',
        email: 'casey.rodriguez@secureguard.com',
        phone: '+1-416-555-1009',
        dateOfBirth: new Date('1994-09-12'),
        hireDate: new Date('2023-02-14'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 26.00,
        certifications: ['Security Guard License', 'First Aid', 'CPR'],
        emergencyContact: {
          name: 'Miguel Rodriguez',
          relationship: 'Brother',
          phone: '+1-416-555-1010'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-006',
        firstName: 'Jamie',
        lastName: 'Hernandez',
        email: 'jamie.hernandez@secureguard.com',
        phone: '+1-416-555-1011',
        dateOfBirth: new Date('1996-12-25'),
        hireDate: new Date('2023-05-01'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 25.50,
        certifications: ['Security Guard License', 'First Aid'],
        emergencyContact: {
          name: 'Rosa Hernandez',
          relationship: 'Mother',
          phone: '+1-416-555-1012'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-007',
        firstName: 'Riley',
        lastName: 'Lopez',
        email: 'riley.lopez@secureguard.com',
        phone: '+1-416-555-1013',
        dateOfBirth: new Date('1999-04-18'),
        hireDate: new Date('2024-01-08'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'PART_TIME',
        status: 'ACTIVE',
        hourlyRate: 23.50,
        certifications: ['Security Guard License'],
        emergencyContact: {
          name: 'David Lopez',
          relationship: 'Father',
          phone: '+1-416-555-1014'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-008',
        firstName: 'Avery',
        lastName: 'Gonzalez',
        email: 'avery.gonzalez@secureguard.com',
        phone: '+1-416-555-1015',
        dateOfBirth: new Date('1993-08-05'),
        hireDate: new Date('2022-09-12'),
        position: 'Senior Security Guard',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 29.00,
        certifications: ['Security Guard License', 'First Aid', 'CPR', 'Advanced Security Training'],
        emergencyContact: {
          name: 'Jennifer Gonzalez',
          relationship: 'Spouse',
          phone: '+1-416-555-1016'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-009',
        firstName: 'Cameron',
        lastName: 'Perez',
        email: 'cameron.perez@secureguard.com',
        phone: '+1-416-555-1017',
        dateOfBirth: new Date('1991-01-20'),
        hireDate: new Date('2022-03-01'),
        position: 'Security Supervisor',
        department: 'Operations',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        hourlyRate: 33.00,
        certifications: ['Security Guard License', 'First Aid', 'CPR', 'Supervisor Training', 'Emergency Response'],
        emergencyContact: {
          name: 'Samuel Perez',
          relationship: 'Brother',
          phone: '+1-416-555-1018'
        },
        companyId: company._id
      },
      {
        employeeId: 'EMP-010',
        firstName: 'Dakota',
        lastName: 'Sanchez',
        email: 'dakota.sanchez@secureguard.com',
        phone: '+1-416-555-1019',
        dateOfBirth: new Date('2000-06-14'),
        hireDate: new Date('2024-02-15'),
        position: 'Security Guard',
        department: 'Operations',
        employmentType: 'PART_TIME',
        status: 'ACTIVE',
        hourlyRate: 23.00,
        certifications: ['Security Guard License'],
        emergencyContact: {
          name: 'Maria Sanchez',
          relationship: 'Mother',
          phone: '+1-416-555-1020'
        },
        companyId: company._id
      }
    ]);
    console.log(`✓ ${employees.length} employees created\n`);

    // ====================================
    // 5. ASSIGN EMPLOYEES TO SITES
    // ====================================
    console.log('5️⃣  Assigning employees to sites...');
    const EmployeeSite = require('../models/EmployeeSite');

    // Assign multiple employees to each site
    const assignments = [];

    // Downtown Shopping Mall - 3 employees
    assignments.push(
      { employeeId: employees[0]._id, siteId: sites[0]._id, isPrimary: true, companyId: company._id },
      { employeeId: employees[1]._id, siteId: sites[0]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[3]._id, siteId: sites[0]._id, isPrimary: false, companyId: company._id }
    );

    // Tech Corporate Office - 2 employees
    assignments.push(
      { employeeId: employees[2]._id, siteId: sites[1]._id, isPrimary: true, companyId: company._id },
      { employeeId: employees[4]._id, siteId: sites[1]._id, isPrimary: false, companyId: company._id }
    );

    // Warehouse - 4 employees
    assignments.push(
      { employeeId: employees[5]._id, siteId: sites[2]._id, isPrimary: true, companyId: company._id },
      { employeeId: employees[6]._id, siteId: sites[2]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[7]._id, siteId: sites[2]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[9]._id, siteId: sites[2]._id, isPrimary: false, companyId: company._id }
    );

    // Luxury Apartments - 2 employees
    assignments.push(
      { employeeId: employees[1]._id, siteId: sites[3]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[3]._id, siteId: sites[3]._id, isPrimary: false, companyId: company._id }
    );

    // University Campus - 3 employees
    assignments.push(
      { employeeId: employees[8]._id, siteId: sites[4]._id, isPrimary: true, companyId: company._id },
      { employeeId: employees[0]._id, siteId: sites[4]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[4]._id, siteId: sites[4]._id, isPrimary: false, companyId: company._id }
    );

    // Hospital - 5 employees
    assignments.push(
      { employeeId: employees[2]._id, siteId: sites[5]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[5]._id, siteId: sites[5]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[7]._id, siteId: sites[5]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[8]._id, siteId: sites[5]._id, isPrimary: false, companyId: company._id },
      { employeeId: employees[9]._id, siteId: sites[5]._id, isPrimary: false, companyId: company._id }
    );

    await EmployeeSite.insertMany(assignments);
    console.log(`✓ ${assignments.length} employee-site assignments created\n`);

    // ====================================
    // SUMMARY
    // ====================================
    console.log('═══════════════════════════════════════════');
    console.log('✅ DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`   • 1 Company: ${company.name}`);
    console.log(`   • ${users.length} Users created`);
    console.log(`   • ${sites.length} Sites created`);
    console.log(`   • ${employees.length} Employees created`);
    console.log(`   • ${assignments.length} Employee-Site assignments\n`);

    console.log('👤 Login Credentials:\n');
    console.log('   ADMIN:');
    console.log('   Email: admin@secureguard.com');
    console.log('   Password: admin123\n');

    console.log('   MANAGER:');
    console.log('   Email: manager@secureguard.com');
    console.log('   Password: manager123\n');

    console.log('   SUPERVISOR:');
    console.log('   Email: supervisor@secureguard.com');
    console.log('   Password: supervisor123\n');

    console.log('   USERS:');
    console.log('   Email: user1@secureguard.com');
    console.log('   Password: user1234');
    console.log('   Email: user2@secureguard.com');
    console.log('   Password: user1234\n');

    console.log('🏢 Sites Created:');
    sites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.siteLocationName} (${site.shortName}) - ${site.client}`);
    });

    console.log('\n👷 Employees Created:');
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName} - ${emp.position} (${emp.employeeId})`);
    });

    console.log('\n✓ You can now log in to the application!\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();
