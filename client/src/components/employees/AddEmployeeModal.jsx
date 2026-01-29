import { useState, useEffect } from 'react';
import { X, Upload, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import toast from 'react-hot-toast';
import { siteApi, employeeApi } from '../../lib/api';

export default function AddEmployeeModal({ isOpen, onClose, onSave, employee = null }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    password: '',
    isActive: true
  });

  const [sites, setSites] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);

  // Fetch sites on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchSites = async () => {
        try {
          const response = await siteApi.getAll({ limit: 100 });
          const sitesData = response.data.data?.sites || response.data.data || [];
          // Transform sites to ensure they have an id field
          const transformedSites = sitesData.map(site => ({
            ...site,
            id: site.id || site._id
          }));
          setSites(transformedSites);
        } catch (err) {
          console.error('Failed to fetch sites:', err);
          toast.error('Failed to load sites');
        }
      };
      fetchSites();
    }
  }, [isOpen]);

  // Reset form when modal opens with employee data or new
  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          phone: employee.phone || '',
          position: employee.position || '',
          department: employee.department || '',
          password: '', // Don't populate password for security
          isActive: employee.isActive !== undefined ? employee.isActive : true
        });
        setSelectedSites([]);
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          password: '',
          isActive: true
        });
        setSelectedSites([]);
      }
    }
  }, [isOpen, employee]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSiteToggle = (siteId) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password validation for new employees
    if (!employee && !formData.password) {
      toast.error('Password is required for new employees');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Pass both employee data and selected sites to parent
    try {
      await onSave(formData, selectedSites);
    } catch (err) {
      // Error already handled in parent
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            {employee ? 'Edit Employee' : 'Employee Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Left Column - Form Fields */}
            <div className="flex-1 p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee No.</Label>
                  <Input
                    value={employee?.id ? employee.id.slice(-4) : 'Auto'}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleChange('isActive', e.target.value === 'active')}
                    className="mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="mt-1"
                    placeholder="First Name"
                    required
                  />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input
                    className="mt-1"
                    placeholder="Middle Name"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="mt-1"
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mobile</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-1"
                    placeholder="###-###-###"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-1"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Login Credentials */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Login Credentials</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Provide a password to allow this employee to log in and view their schedules
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Password {!employee && '*'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="mt-1"
                      placeholder={employee ? "Leave blank to keep current password" : "Enter password"}
                      required={!employee}
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {employee ? "Leave blank to keep current password" : "Minimum 8 characters"}
                    </p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value="USER (View Own Shifts)"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Employees can view their own schedules
                    </p>
                  </div>
                </div>
              </div>

              {/* Position */}
              <div>
                <Label>What Position(s) Does Employee Work? *</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className="mt-1"
                  placeholder="e.g., Dispatcher, Driver, Manager"
                  required
                />
              </div>

              {/* Address Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      className="mt-1"
                      placeholder="Enter a location"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Town/Suburb</Label>
                      <Input
                        className="mt-1"
                        placeholder="Enter Suburb, Town, City or Postcode"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Select className="mt-1">
                        <option value="">Select State</option>
                        <option value="NSW">NSW</option>
                        <option value="QLD">QLD</option>
                        <option value="VIC">VIC</option>
                        <option value="SA">SA</option>
                        <option value="WA">WA</option>
                        <option value="TAS">TAS</option>
                        <option value="NT">NT</option>
                        <option value="ACT">ACT</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input
                        className="mt-1"
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Employment</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Team</Label>
                      <Select className="mt-1">
                        <option value="">Select Team</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        className="mt-1"
                        placeholder="Department"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Custom ID/Ref (1)</Label>
                      <Input className="mt-1" />
                    </div>
                    <div>
                      <Label>Custom ID/Ref (2)</Label>
                      <Input className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Assignment Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Site Assignment</h3>
                <p className="text-sm text-gray-600 mb-3">Select the sites this employee will be assigned to:</p>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                  {sites.length === 0 ? (
                    <p className="text-sm text-gray-500">No sites available</p>
                  ) : (
                    sites.map((site) => (
                      <label
                        key={site.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSites.includes(site.id)}
                          onChange={() => handleSiteToggle(site.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {site.shortName} - {site.siteLocationName}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedSites.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    {selectedSites.length} site{selectedSites.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Emergency Contact Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Emergency Contact Full Name</Label>
                      <Input
                        className="mt-1"
                        placeholder="Emergency Contact Full Name"
                      />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Select className="mt-1">
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Emergency Phone</Label>
                    <Input
                      type="tel"
                      className="mt-1"
                      placeholder="Emergency Phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Photo and Settings */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 space-y-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-300 rounded flex items-center justify-center mb-4">
                  <User className="w-24 h-24 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>

              {/* Grading/Ranking */}
              <div>
                <Label className="mb-2 block">Grading/Ranking</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-2xl text-gray-300 hover:text-yellow-400"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="mb-0">Roster Access</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-blue-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0">Mobile Attendance Access</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-blue-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-xs">Clock In/Out Against Adhoc Shifts</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-blue-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-xs">Add/Maintain Manual Timesheets</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-red-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0">QR/NFC Clocking</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-red-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0">Send Invitation</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-blue-500 rounded-full relative"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary">
                Save
              </Button>
              <Button type="button" variant="outline">
                Actions ▼
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
