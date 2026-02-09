import { useState, useEffect } from "react";
import { X, Upload, User } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import toast from "react-hot-toast";

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSave,
  employee = null,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    isActive: true,
  });

  // Reset form when modal opens with employee data or new
  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          email: employee.email || "",
          phone: employee.phone || "",
          position: employee.position || "",
          department: employee.department || "",
          isActive: employee.isActive !== undefined ? employee.isActive : true,
        });
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          position: "",
          department: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, employee]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.position
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[hsl(220,15%,20%)]">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            {employee ? "Edit Employee" : "Employee Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[hsl(220,15%,18%)] text-gray-400 hover:text-gray-200 transition-colors"
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
                  <Label className="text-gray-300">Employee No.</Label>
                  <Input
                    value={employee?.id ? employee.id.slice(-4) : "Auto"}
                    disabled
                    className="mt-1 bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Status *</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      handleChange("isActive", e.target.value === "active")
                    }
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    placeholder="First Name"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Middle Name</Label>
                  <Input
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    placeholder="Middle Name"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Mobile</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    placeholder="###-###-###"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <Label className="text-gray-300">
                  What Position(s) Does Employee Work? *
                </Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                  placeholder="e.g., Dispatcher, Driver, Manager"
                  required
                />
              </div>

              {/* Address Section */}
              <div className="pt-4 border-t border-[hsl(220,15%,20%)]">
                <h3 className="text-md font-semibold text-gray-100 mb-4">
                  Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Address</Label>
                    <Input
                      className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                      placeholder="Enter a location"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300">Town/Suburb</Label>
                      <Input
                        className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        placeholder="Enter Suburb, Town, City or Postcode"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">State</Label>
                      <Select className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100">
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
                      <Label className="text-gray-300">Postal Code</Label>
                      <Input
                        className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Section */}
              <div className="pt-4 border-t border-[hsl(220,15%,20%)]">
                <h3 className="text-md font-semibold text-gray-100 mb-4">
                  Employment
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Team</Label>
                      <Select className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100">
                        <option value="">Select Team</option>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Department</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) =>
                          handleChange("department", e.target.value)
                        }
                        className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        placeholder="Department"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Custom ID/Ref (1)</Label>
                      <Input className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500" />
                    </div>
                    <div>
                      <Label className="text-gray-300">Custom ID/Ref (2)</Label>
                      <Input className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="pt-4 border-t border-[hsl(220,15%,20%)]">
                <h3 className="text-md font-semibold text-gray-100 mb-4">
                  Emergency Contact
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">
                        Emergency Contact Full Name
                      </Label>
                      <Input
                        className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        placeholder="Emergency Contact Full Name"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Relationship</Label>
                      <Select className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100">
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
                    <Label className="text-gray-300">Emergency Phone</Label>
                    <Input
                      type="tel"
                      className="mt-1 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                      placeholder="Emergency Phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Photo and Settings */}
            <div className="w-80 bg-[hsl(220,15%,16%)] border-l border-[hsl(220,15%,20%)] p-6 space-y-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-[hsl(220,15%,20%)] rounded-lg flex items-center justify-center mb-4 border border-[hsl(220,15%,22%)]">
                  <User className="w-24 h-24 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>

              {/* Grading/Ranking */}
              <div>
                <Label className="mb-2 block text-gray-300">
                  Grading/Ranking
                </Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-2xl text-gray-600 hover:text-orange-500 transition-colors"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-gray-300">Roster Access</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-orange-600 rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-gray-300">
                    Mobile Attendance Access
                  </Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-orange-600 rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-xs text-gray-300">
                    Clock In/Out Against Adhoc Shifts
                  </Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-orange-600 rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-xs text-gray-300">
                    Add/Maintain Manual Timesheets
                  </Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-[hsl(220,15%,22%)] rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-gray-300">QR/NFC Clocking</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-[hsl(220,15%,22%)] rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="mb-0 text-gray-300">Send Invitation</Label>
                  <button
                    type="button"
                    className="w-12 h-6 bg-orange-600 rounded-full relative transition-colors"
                  >
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-[hsl(220,15%,20%)] bg-[hsl(220,15%,16%)]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
              >
                Actions ▼
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
