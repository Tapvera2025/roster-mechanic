const service = require('../clockInOut.service');
const Employee = require('../../models/Employee');
const Site = require('../../models/Site');
const TimeRecord = require('../../models/TimeRecord');
const Shift = require('../../models/Shift');
const EmployeeSite = require('../../models/EmployeeSite');
const GeofenceViolation = require('../../models/GeofenceViolation');
const mongoose = require('mongoose');

jest.mock('../../models/Employee');
jest.mock('../../models/Site');
jest.mock('../../models/TimeRecord');
jest.mock('../../models/Shift');
jest.mock('../../models/EmployeeSite');
jest.mock('../../models/GeofenceViolation');
jest.mock('../email.service', () => ({
  notifyAdhocShiftCreated: jest.fn().mockResolvedValue(true),
  sendTimeRecordRejectionEmail: jest.fn().mockResolvedValue(true),
}));

describe('ClockInOutService.clockInAdhoc', () => {
  let mockSession;
  let employeeId;
  let siteId1;
  let siteId2;
  let companyId;
  let userId;

  beforeEach(() => {
    employeeId = new mongoose.Types.ObjectId().toString();
    siteId1 = new mongoose.Types.ObjectId().toString();
    siteId2 = new mongoose.Types.ObjectId().toString();
    companyId = new mongoose.Types.ObjectId().toString();
    userId = new mongoose.Types.ObjectId().toString();
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
      _id: employeeId,
      name: 'John Doe',
      position: 'Technician',
    };

    const mockSite1 = {
      _id: siteId1,
      siteLocationName: 'Site Alpha',
      location: { coordinates: [-79.3832, 43.6532] }, // [lon, lat]
      geoFenceRadius: 100,
    };

    const mockSite2 = {
      _id: siteId2,
      siteLocationName: 'Site Beta',
      location: { coordinates: [-79.4000, 43.7000] },
      geoFenceRadius: 100,
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    EmployeeSite.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ siteId: siteId1 }, { siteId: siteId2 }]),
    });
    Site.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockSite1, mockSite2]),
    });
    TimeRecord.findOne.mockResolvedValue(null); // No active clock-in
    Shift.create.mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), siteId: siteId1 }]);
    TimeRecord.create.mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }]);

    const context = { companyId, userId };
    const data = {
      employeeId,
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] }, // Close to site1
      adhocReason: 'Emergency equipment repair needed urgently',
      position: 'Maintenance Tech',
      photo: null,
    };

    const result = await service.clockInAdhoc(context, data);

    expect(Employee.findOne).toHaveBeenCalledWith({
      _id: employeeId,
      companyId,
      isActive: true,
    });

    expect(EmployeeSite.find).toHaveBeenCalledWith({
      employeeId,
      companyId,
      isActive: true,
    });

    expect(Site.find).toHaveBeenCalledWith({
      _id: { $in: [siteId1, siteId2] },
      status: 'ACTIVE',
      companyId,
    });

    expect(Shift.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          employeeId,
          siteId: siteId1, // Closest site auto-detected
          isAdhoc: true,
          adhocReason: 'Emergency equipment repair needed urgently',
          adhocInitiatedBy: 'EMPLOYEE',
          status: 'IN_PROGRESS',
          endTime: null,
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
      _id: employeeId,
    };

    const mockSite = {
      _id: siteId1,
      location: { coordinates: [-79.5000, 43.8000] }, // Far away
      geoFenceRadius: 100,
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    EmployeeSite.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ siteId: siteId1 }]),
    });
    Site.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockSite]),
    });
    TimeRecord.findOne.mockResolvedValue(null);
    GeofenceViolation.create.mockResolvedValue({});

    const context = { companyId, userId };
    const data = {
      employeeId,
      location: { type: 'Point', coordinates: [-79.3835, 43.6530] },
      adhocReason: 'Emergency repair',
      position: null,
      photo: null,
    };

    await expect(service.clockInAdhoc(context, data)).rejects.toThrow(
      'You are not within range of any assigned site'
    );
  });

  test('should throw error if adhoc reason too short', async () => {
    const context = { companyId, userId };
    const data = {
      employeeId,
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
      _id: employeeId,
    };

    Employee.findOne.mockResolvedValue(mockEmployee);
    TimeRecord.findOne.mockResolvedValue({ _id: 'existing-record', status: 'CLOCKED_IN' });

    const context = { companyId, userId };
    const data = {
      employeeId,
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

describe('ClockInOutService.clockOut', () => {
  let mockSession;
  let employeeId;
  let siteId;
  let shiftId;
  let companyId;
  let userId;

  beforeEach(() => {
    employeeId = new mongoose.Types.ObjectId().toString();
    siteId = new mongoose.Types.ObjectId().toString();
    shiftId = new mongoose.Types.ObjectId().toString();
    companyId = new mongoose.Types.ObjectId().toString();
    userId = new mongoose.Types.ObjectId().toString();
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

  test('sets endTime when completing an open ad hoc shift', async () => {
    const timeRecord = {
      _id: new mongoose.Types.ObjectId(),
      employeeId,
      shiftId,
      siteId: {
        _id: siteId,
        siteLocationName: 'Allocated Site',
        location: { coordinates: [151.2093, -33.8688] },
        geoFenceRadius: 150,
      },
      clockInTime: new Date(Date.now() - 60 * 60 * 1000),
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
    };

    TimeRecord.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(timeRecord),
    });
    Shift.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue({ isAdhoc: true, endTime: null }),
      }),
    });
    Shift.findOneAndUpdate.mockResolvedValue({});

    await service.clockOut(
      { companyId, userId },
      {
        employeeId,
        latitude: -33.8688,
        longitude: 151.2093,
        photoUrl: null,
      }
    );

    expect(Shift.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: shiftId,
        companyId,
      },
      expect.objectContaining({
        status: 'COMPLETED',
        actualEndTime: expect.any(Date),
        endTime: expect.any(Date),
        clockOutLocation: {
          type: 'Point',
          coordinates: [151.2093, -33.8688],
        },
      }),
      { session: mockSession }
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});

describe('ClockInOutService.clockIn', () => {
  let mockSession;
  let employeeId;
  let requestedSiteId;
  let shiftSiteId;
  let shiftId;
  let companyId;
  let userId;

  beforeEach(() => {
    employeeId = new mongoose.Types.ObjectId().toString();
    requestedSiteId = new mongoose.Types.ObjectId().toString();
    shiftSiteId = new mongoose.Types.ObjectId().toString();
    shiftId = new mongoose.Types.ObjectId().toString();
    companyId = new mongoose.Types.ObjectId().toString();
    userId = new mongoose.Types.ObjectId().toString();
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

  test('uses the allocated shift site for scheduled geofence checks', async () => {
    const timeRecord = {
      _id: new mongoose.Types.ObjectId(),
      populate: jest.fn().mockResolvedValue(undefined),
    };

    Employee.findOne.mockResolvedValue({ _id: employeeId, isActive: true });
    Shift.findOne.mockResolvedValue({
      _id: shiftId,
      employeeId,
      siteId: shiftSiteId,
      status: 'SCHEDULED',
    });
    Site.findOne.mockResolvedValue({
      _id: shiftSiteId,
      siteLocationName: 'Allocated Site',
      location: { coordinates: [151.2093, -33.8688] },
      geoFenceRadius: 150,
    });
    TimeRecord.findOne.mockResolvedValue(null);
    TimeRecord.create.mockResolvedValue([timeRecord]);
    Shift.findOneAndUpdate.mockResolvedValue({});

    await service.clockIn(
      { companyId, userId },
      {
        employeeId,
        siteId: requestedSiteId,
        shiftId,
        latitude: -33.8687,
        longitude: 151.2094,
        photoUrl: null,
      }
    );

    expect(Site.findOne).toHaveBeenCalledWith({
      _id: shiftSiteId,
      companyId,
      status: 'ACTIVE',
    });
    expect(TimeRecord.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          employeeId,
          siteId: shiftSiteId,
          shiftId,
        }),
      ],
      { session: mockSession }
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});
