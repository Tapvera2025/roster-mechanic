const service = require('../clockInOut.service');
const Employee = require('../../models/Employee');
const Site = require('../../models/Site');
const TimeRecord = require('../../models/TimeRecord');
const Shift = require('../../models/Shift');
const mongoose = require('mongoose');

jest.mock('../../models/Employee');
jest.mock('../../models/Site');
jest.mock('../../models/TimeRecord');
jest.mock('../../models/Shift');

describe('ClockInOutService.clockInAdhoc', () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should auto-detect nearest site and create adhoc shift', async () => {
    const mockEmployee = {
      _id: 'employee123',
      name: 'John Doe',
      sites: ['site1', 'site2'],
      position: 'Technician',
    };

    const mockSite1 = {
      _id: 'site1',
      siteLocationName: 'Site Alpha',
      location: { coordinates: [-79.3832, 43.6532] }, // [lon, lat]
      geoFenceRadius: 100,
    };

    const mockSite2 = {
      _id: 'site2',
      siteLocationName: 'Site Beta',
      location: { coordinates: [-79.4000, 43.7000] },
      geoFenceRadius: 100,
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    Site.find.mockResolvedValue([mockSite1, mockSite2]);
    TimeRecord.findOne.mockResolvedValue(null); // No active clock-in
    Shift.create.mockResolvedValue([{ _id: 'shift123', siteId: 'site1' }]);
    TimeRecord.create.mockResolvedValue([{ _id: 'record123' }]);

    const context = { companyId: 'company123', userId: 'user123' };
    const data = {
      employeeId: 'employee123',
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] }, // Close to site1
      adhocReason: 'Emergency equipment repair needed urgently',
      position: 'Maintenance Tech',
      photo: null,
    };

    const result = await service.clockInAdhoc(context, data);

    expect(Employee.findOne).toHaveBeenCalledWith({
      _id: 'employee123',
      companyId: 'company123',
      isActive: true,
    });

    expect(Site.find).toHaveBeenCalledWith({
      _id: { $in: ['site1', 'site2'] },
      status: 'ACTIVE',
      companyId: 'company123',
    });

    expect(Shift.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          employeeId: 'employee123',
          siteId: 'site1', // Closest site auto-detected
          isAdhoc: true,
          adhocReason: 'Emergency equipment repair needed urgently',
          adhocInitiatedBy: 'EMPLOYEE',
          status: 'IN_PROGRESS',
        }),
      ],
      { session: mockSession }
    );

    expect(result).toHaveProperty('shift');
    expect(result).toHaveProperty('timeRecord');
    expect(result.detectedSite).toBeDefined();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  test('should throw error if no site within geofence range', async () => {
    const mockEmployee = {
      _id: 'employee123',
      sites: ['site1'],
    };

    const mockSite = {
      _id: 'site1',
      location: { coordinates: [-79.5000, 43.8000] }, // Far away
      geoFenceRadius: 100,
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    Site.find.mockResolvedValue([mockSite]);

    const context = { companyId: 'company123', userId: 'user123' };
    const data = {
      employeeId: 'employee123',
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] },
      adhocReason: 'Emergency repair',
      position: null,
      photo: null,
    };

    await expect(service.clockInAdhoc(context, data)).rejects.toThrow(
      'You are not within range of any assigned site'
    );

    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  test('should throw error if adhoc reason too short', async () => {
    const context = { companyId: 'company123', userId: 'user123' };
    const data = {
      employeeId: 'employee123',
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] },
      adhocReason: 'Short', // Less than 10 characters
      position: null,
      photo: null,
    };

    await expect(service.clockInAdhoc(context, data)).rejects.toThrow(
      'Adhoc reason must be at least 10 characters'
    );
  });

  test('should throw error if employee already clocked in', async () => {
    const mockEmployee = {
      _id: 'employee123',
      sites: ['site1'],
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    TimeRecord.findOne.mockResolvedValue({ _id: 'existing-record', status: 'CLOCKED_IN' });

    const context = { companyId: 'company123', userId: 'user123' };
    const data = {
      employeeId: 'employee123',
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] },
      adhocReason: 'Emergency equipment repair',
      position: null,
      photo: null,
    };

    await expect(service.clockInAdhoc(context, data)).rejects.toThrow(
      'Employee already has an active clock-in'
    );
  });
});
