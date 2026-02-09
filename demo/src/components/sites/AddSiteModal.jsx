import { useState, useRef } from "react";
import {
  X,
  MapPin,
  Save,
  ChevronDown,
  Users,
  Key,
  Info,
  Target,
  Plus,
  RotateCw,
  Eye,
  EyeOff,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { siteApi } from "../../lib/api";

export default function AddSiteModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("address");
  const [geoFenceRadius, setGeoFenceRadius] = useState(0.3);
  const [accessCodeExpanded, setAccessCodeExpanded] = useState(true);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // API state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [accessCodeData, setAccessCodeData] = useState({
    codeName: "",
    accessCode: "",
    notes: "",
    visibleOnMobile: "no",
    whenRostered: "no",
    afterClockingIn: "no",
  });

  const [formData, setFormData] = useState({
    siteLocationName: "",
    shortName: "",
    jobRefNo: "",
    status: "Active",
    client: "",
    flatBillingRate: "",
    alertRecipient: "",
    exportId: "",
    region: "",
    remindEmployees: "2 hours before",
    defaultStartTime: "",
    defaultEndTime: "",
    defaultShiftDuration: "",
    address: "",
    state: "",
    townSuburb: "",
    postalCode: "",
    timezone: "(UTC+10:00) Canberra, Melbourne, Sydney",
    latitude: "",
    longitude: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setErrors({});

      // Build request payload from formData
      const payload = {
        ...formData,
        flatBillingRate: formData.flatBillingRate
          ? parseFloat(formData.flatBillingRate)
          : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        geoFenceRadius: geoFenceRadius,
        defaultShiftDuration: formData.defaultShiftDuration
          ? parseInt(formData.defaultShiftDuration)
          : null,
        status: formData.status === "Active" ? "ACTIVE" : "INACTIVE",
      };

      const response = await siteApi.create(payload);

      // If access code data exists, add it
      if (accessCodeData.codeName && accessCodeData.accessCode) {
        await siteApi.addAccessCode(response.data.data.id, {
          ...accessCodeData,
          visibleOnMobile: accessCodeData.visibleOnMobile === "yes",
          whenRostered: accessCodeData.whenRostered === "yes",
          afterClockingIn: accessCodeData.afterClockingIn === "yes",
        });
      }

      toast.success("Site created successfully");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
      toast.error(err.response?.data?.message || "Failed to create site");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest(".modal-header")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl w-full max-w-7xl my-4 flex flex-col shadow-2xl"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header */}
        <div
          className="modal-header flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[hsl(220,15%,20%)] gap-2 flex-wrap rounded-t-3xl cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <h2 className="text-base sm:text-lg font-bold text-gray-100">
              Site Details
            </h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-500/10 transition-colors flex items-center gap-1 sm:gap-2">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">New Site</span>
            </button>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed border-orange-600"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {submitting ? "Saving..." : "Save"}
              </span>
            </Button>
            <button className="hidden lg:flex px-3 py-2 border border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-gray-300 rounded-lg hover:bg-[hsl(220,15%,22%)] transition-colors items-center gap-2 text-sm">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
          <div className="p-6">
            {/* Site Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Site/Location Name
                </label>
                <Input
                  value={formData.siteLocationName}
                  onChange={(e) =>
                    handleInputChange("siteLocationName", e.target.value)
                  }
                  placeholder=""
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Short Name
                </label>
                <Input
                  value={formData.shortName}
                  onChange={(e) =>
                    handleInputChange("shortName", e.target.value)
                  }
                  placeholder=""
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Job Ref No.
                </label>
                <Input
                  value={formData.jobRefNo}
                  onChange={(e) =>
                    handleInputChange("jobRefNo", e.target.value)
                  }
                  placeholder=""
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Client
                </label>
                <Select
                  value={formData.client}
                  onChange={(e) => handleInputChange("client", e.target.value)}
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                >
                  <option value="">Select Client</option>
                  <option value="internal">Internal Company Site</option>
                  <option value="qld-rail">Queensland Rail</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Flat Billing Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <Input
                    className="pl-7 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                    value={formData.flatBillingRate}
                    onChange={(e) =>
                      handleInputChange("flatBillingRate", e.target.value)
                    }
                    placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Alert & Notifications Recipient
                  <Info className="w-3 h-3 text-orange-500" />
                </label>
                <Select
                  value={formData.alertRecipient}
                  onChange={(e) =>
                    handleInputChange("alertRecipient", e.target.value)
                  }
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                >
                  <option value="">Select</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Export/External ID
                  <Info className="w-3 h-3 text-orange-500" />
                </label>
                <Input
                  value={formData.exportId}
                  onChange={(e) =>
                    handleInputChange("exportId", e.target.value)
                  }
                  placeholder=""
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Region
                </label>
                <Input
                  value={formData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  placeholder=""
                  className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                  />
                  <span>No break time deduction defined.</span>
                  <a href="#" className="text-orange-500 hover:underline">
                    Manage automatic break time deductions
                  </a>
                  <Info className="w-4 h-4 text-orange-500" />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Remind Employees for Upcoming Shifts
                </label>
                <Select
                  value={formData.remindEmployees}
                  onChange={(e) =>
                    handleInputChange("remindEmployees", e.target.value)
                  }
                  className="max-w-xs bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                >
                  <option value="2 hours before">2 hours before</option>
                  <option value="1 hour before">1 hour before</option>
                  <option value="30 minutes before">30 minutes before</option>
                </Select>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-1">
                Scheduling
                <Info className="w-4 h-4 text-orange-500" />
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default Start Time
                  </label>
                  <Select
                    value={formData.defaultStartTime}
                    onChange={(e) =>
                      handleInputChange("defaultStartTime", e.target.value)
                    }
                    className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                  >
                    <option value="">Select</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default End Time
                  </label>
                  <Select
                    value={formData.defaultEndTime}
                    onChange={(e) =>
                      handleInputChange("defaultEndTime", e.target.value)
                    }
                    className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                  >
                    <option value="">Select</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default Shift Duration
                  </label>
                  <Select
                    value={formData.defaultShiftDuration}
                    onChange={(e) =>
                      handleInputChange("defaultShiftDuration", e.target.value)
                    }
                    className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                  >
                    <option value="">Select</option>
                    <option value="8">8 hours</option>
                    <option value="10">10 hours</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tabs and Content Section */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Sidebar Tabs */}
              <div className="flex md:flex-col gap-2 md:w-44 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("address")}
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "address"
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-[hsl(220,15%,16%)] text-orange-500 border border-[hsl(220,15%,22%)] hover:bg-[hsl(220,15%,18%)]"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "contact"
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-[hsl(220,15%,16%)] text-orange-500 border border-[hsl(220,15%,22%)] hover:bg-[hsl(220,15%,18%)]"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Contact Information</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("access")}
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "access"
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-[hsl(220,15%,16%)] text-orange-500 border border-[hsl(220,15%,22%)] hover:bg-[hsl(220,15%,18%)]"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Access Codes</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 border border-[hsl(220,15%,20%)] rounded-xl p-6 bg-[hsl(220,15%,16%)]">
                {activeTab === "address" && (
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-gray-100">
                      Address
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Address
                        </label>
                        <Input
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          placeholder="Enter a location"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          State
                        </label>
                        <Select
                          value={formData.state}
                          onChange={(e) =>
                            handleInputChange("state", e.target.value)
                          }
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100"
                        >
                          <option value="">Select</option>
                          <option value="QLD">QLD</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Town/Suburb
                        </label>
                        <Input
                          value={formData.townSuburb}
                          onChange={(e) =>
                            handleInputChange("townSuburb", e.target.value)
                          }
                          placeholder="Enter Suburb, Town, City or Postcode"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Postal Code
                        </label>
                        <Input
                          value={formData.postalCode}
                          onChange={(e) =>
                            handleInputChange("postalCode", e.target.value)
                          }
                          placeholder=""
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    {/* GeoLocation Section */}
                    <div className="border-t border-[hsl(220,15%,22%)] pt-6 mt-6">
                      <h4 className="text-sm font-semibold text-gray-400 mb-4">
                        GeoLocation
                      </h4>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Timezone
                        </label>
                        <Select
                          value={formData.timezone}
                          onChange={(e) =>
                            handleInputChange("timezone", e.target.value)
                          }
                          className="max-w-md bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100"
                        >
                          <option value="(UTC+10:00) Canberra, Melbourne, Sydney">
                            (UTC+10:00) Canberra, Melbourne, Sydney
                          </option>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Latitude
                          </label>
                          <Input
                            value={formData.latitude}
                            onChange={(e) =>
                              handleInputChange("latitude", e.target.value)
                            }
                            placeholder=""
                            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Longitude
                          </label>
                          <Input
                            value={formData.longitude}
                            onChange={(e) =>
                              handleInputChange("longitude", e.target.value)
                            }
                            placeholder=""
                            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mb-6">
                        <Button
                          variant="outline"
                          className="bg-orange-600 text-white hover:bg-orange-700 border-orange-600"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Get Map Address
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-orange-600 text-white hover:bg-orange-700 border-orange-600"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View Map
                        </Button>
                      </div>

                      {/* GEOFence Radius Slider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          GEOFence Radius
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400 w-16">
                            {geoFenceRadius.toFixed(1)} km
                          </span>
                          <div className="flex-1 relative max-w-lg">
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="0.1"
                              value={geoFenceRadius}
                              onChange={(e) =>
                                setGeoFenceRadius(parseFloat(e.target.value))
                              }
                              className="w-full h-2 bg-[hsl(220,15%,22%)] rounded-lg appearance-none cursor-pointer slider-thumb"
                              style={{
                                background: `linear-gradient(to right, #ea580c 0%, #ea580c ${(geoFenceRadius / 5) * 100}%, hsl(220, 15%, 22%) ${(geoFenceRadius / 5) * 100}%, hsl(220, 15%, 22%) 100%)`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-16 text-right">
                            5.0 km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "contact" && (
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-gray-100">
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Contact Person
                        </label>
                        <Input
                          placeholder="Enter contact person name"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Position/Title
                        </label>
                        <Input
                          placeholder="Enter position"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Mobile Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="Enter mobile number"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Additional Notes
                        </label>
                        <textarea
                          className="flex w-full rounded-md border border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] px-3 py-2 text-sm text-gray-100 ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
                          placeholder="Enter any additional contact information or notes"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "access" && (
                  <div>
                    {/* New Access Code Section */}
                    <div className="border border-[hsl(220,15%,22%)] rounded-lg mb-6">
                      <button
                        onClick={() =>
                          setAccessCodeExpanded(!accessCodeExpanded)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(220,15%,18%)] hover:bg-[hsl(220,15%,20%)] transition-colors rounded-lg border-b border-[hsl(220,15%,22%)]"
                      >
                        <div className="flex items-center gap-2 text-orange-500">
                          <Key className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            New Access Code
                          </span>
                        </div>
                        {accessCodeExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {accessCodeExpanded && (
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Code Name
                              </label>
                              <Input
                                value={accessCodeData.codeName}
                                onChange={(e) =>
                                  setAccessCodeData({
                                    ...accessCodeData,
                                    codeName: e.target.value,
                                  })
                                }
                                placeholder="Example: Front Gate, Fire Escape, Emergency Exit"
                                className="bg-[hsl(220,15%,20%)] border-[hsl(220,15%,24%)] text-gray-100 placeholder-gray-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Access Code
                              </label>
                              <div className="relative">
                                <Input
                                  type={showAccessCode ? "text" : "password"}
                                  value={accessCodeData.accessCode}
                                  onChange={(e) =>
                                    setAccessCodeData({
                                      ...accessCodeData,
                                      accessCode: e.target.value,
                                    })
                                  }
                                  placeholder=""
                                  className="pr-10 bg-[hsl(220,15%,20%)] border-[hsl(220,15%,24%)] text-gray-100 placeholder-gray-500"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAccessCode(!showAccessCode)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                >
                                  {showAccessCode ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={accessCodeData.notes}
                              onChange={(e) =>
                                setAccessCodeData({
                                  ...accessCodeData,
                                  notes: e.target.value,
                                })
                              }
                              className="flex w-full rounded-md border border-[hsl(220,15%,24%)] bg-[hsl(220,15%,20%)] px-3 py-2 text-sm text-gray-100 ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Visible On Mobile
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="visibleOnMobile"
                                  value="yes"
                                  checked={
                                    accessCodeData.visibleOnMobile === "yes"
                                  }
                                  onChange={(e) =>
                                    setAccessCodeData({
                                      ...accessCodeData,
                                      visibleOnMobile: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4 text-orange-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-orange-500"
                                />
                                <span className="ml-2 text-sm text-gray-300">
                                  Yes
                                </span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="visibleOnMobile"
                                  value="no"
                                  checked={
                                    accessCodeData.visibleOnMobile === "no"
                                  }
                                  onChange={(e) =>
                                    setAccessCodeData({
                                      ...accessCodeData,
                                      visibleOnMobile: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4 text-red-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-gray-300">
                                  No
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="border-t border-[hsl(220,15%,22%)] pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              Employees can see the access codes
                            </h4>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-300">
                                  When rostered
                                </label>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="whenRostered"
                                      value="yes"
                                      checked={
                                        accessCodeData.whenRostered === "yes"
                                      }
                                      onChange={(e) =>
                                        setAccessCodeData({
                                          ...accessCodeData,
                                          whenRostered: e.target.value,
                                        })
                                      }
                                      className="w-4 h-4 text-orange-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-orange-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-300">
                                      Yes
                                    </span>
                                  </label>
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="whenRostered"
                                      value="no"
                                      checked={
                                        accessCodeData.whenRostered === "no"
                                      }
                                      onChange={(e) =>
                                        setAccessCodeData({
                                          ...accessCodeData,
                                          whenRostered: e.target.value,
                                        })
                                      }
                                      className="w-4 h-4 text-red-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-red-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-300">
                                      No
                                    </span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-300">
                                  After clocking in
                                </label>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="afterClockingIn"
                                      value="yes"
                                      checked={
                                        accessCodeData.afterClockingIn === "yes"
                                      }
                                      onChange={(e) =>
                                        setAccessCodeData({
                                          ...accessCodeData,
                                          afterClockingIn: e.target.value,
                                        })
                                      }
                                      className="w-4 h-4 text-orange-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-orange-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-300">
                                      Yes
                                    </span>
                                  </label>
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="afterClockingIn"
                                      value="no"
                                      checked={
                                        accessCodeData.afterClockingIn === "no"
                                      }
                                      onChange={(e) =>
                                        setAccessCodeData({
                                          ...accessCodeData,
                                          afterClockingIn: e.target.value,
                                        })
                                      }
                                      className="w-4 h-4 text-red-600 border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] focus:ring-red-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-300">
                                      No
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add New Button */}
                    <Button
                      variant="outline"
                      className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(220, 15%, 16%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(220, 15%, 30%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(220, 15%, 35%);
        }
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
