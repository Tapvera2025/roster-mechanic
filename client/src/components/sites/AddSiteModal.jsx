import { useState, useRef, useEffect } from "react";
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
import { siteApi, clientApi } from "../../lib/api";
import staticClients from "../../data/clients";

export default function AddSiteModal({ onClose, onSuccess, site = null }) {
  const [activeTab, setActiveTab] = useState("address");
  const [geoFenceRadius, setGeoFenceRadius] = useState(
    site?.geoFenceRadius || 0.3,
  );
  const [accessCodeExpanded, setAccessCodeExpanded] = useState(true);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // API state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [clients, setClients] = useState(staticClients);

  const [accessCodeData, setAccessCodeData] = useState({
    codeName: "",
    accessCode: "",
    notes: "",
    visibleOnMobile: "no",
    whenRostered: "no",
    afterClockingIn: "no",
  });

  const [formData, setFormData] = useState({
    siteLocationName: site?.siteLocationName || "",
    shortName: site?.shortName || "",
    jobRefNo: site?.jobRefNo || "",
    status:
      site?.status === "ACTIVE"
        ? "Active"
        : site?.status === "INACTIVE"
          ? "Inactive"
          : "Active",
    client: site?.client || "",
    flatBillingRate: site?.flatBillingRate || "",
    alertRecipient: site?.alertRecipient || "",
    exportId: site?.exportId || "",
    region: site?.region || "",
    remindEmployees: site?.remindEmployees || "2 hours before",
    defaultStartTime: site?.defaultStartTime || "",
    defaultEndTime: site?.defaultEndTime || "",
    defaultShiftDuration: site?.defaultShiftDuration || "",
    address: site?.address || "",
    state: site?.state || "",
    townSuburb: site?.townSuburb || "",
    postalCode: site?.postalCode || "",
    timezone: site?.timezone || "Australia/Sydney",
    latitude: site?.latitude || "",
    longitude: site?.longitude || "",
  });

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientApi.getAll({ limit: 100 });
        const clientsData =
          response.data.data?.clients || response.data.data || response.data;

        if (Array.isArray(clientsData) && clientsData.length > 0) {
          setClients(clientsData);
        }
      } catch (err) {
        console.warn("Failed to fetch clients, using static data:", err);
        // Keep static clients as fallback
      }
    };

    fetchClients();
  }, []);

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
        // Convert string values to appropriate types
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

      let response;
      if (site) {
        // Update existing site
        response = await siteApi.update(site.id, payload);
      } else {
        // Create new site
        response = await siteApi.create(payload);
      }

      // If access code data exists, add it (only for new sites or if fields are filled)
      if (!site && accessCodeData.codeName && accessCodeData.accessCode) {
        await siteApi.addAccessCode(response.data.data.id, {
          ...accessCodeData,
          visibleOnMobile: accessCodeData.visibleOnMobile === "yes",
          whenRostered: accessCodeData.whenRostered === "yes",
          afterClockingIn: accessCodeData.afterClockingIn === "yes",
        });
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
      toast.error(
        err.response?.data?.message ||
          `Failed to ${site ? "update" : "create"} site`,
      );
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
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="bg-[hsl(var(--color-card))] rounded-lg w-full max-w-7xl my-4 flex flex-col shadow-2xl"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header */}
        <div
          className="modal-header flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[hsl(var(--color-border))] gap-2 flex-wrap bg-[hsl(var(--color-surface-elevated))] rounded-t-lg cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-secondary))]" />
            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--color-foreground))]">
              {site ? "Edit Site" : "Site Details"}
            </h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {!site && (
              <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-pink-600 border border-pink-600 rounded hover:bg-pink-50 transition-colors flex items-center gap-1 sm:gap-2">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Site</span>
              </button>
            )}
            <Button variant="outline" size="icon" className="hidden md:flex">
              <MapPin className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="hidden md:flex">
              <X className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="hidden md:flex">
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {submitting ? "Saving..." : "Save"}
              </span>
            </Button>
            <button className="hidden lg:flex px-3 py-2 border border-[hsl(var(--color-border))] rounded hover:bg-[hsl(var(--color-surface-elevated))] transition-colors items-center gap-2 text-sm text-[hsl(var(--color-foreground))]">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-[hsl(var(--color-border))] rounded transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-secondary))]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
          <div className="p-6">
            {/* Site Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Site/Location Name
                </label>
                <Input
                  value={formData.siteLocationName}
                  onChange={(e) =>
                    handleInputChange("siteLocationName", e.target.value)
                  }
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Short Name
                </label>
                <Input
                  value={formData.shortName}
                  onChange={(e) =>
                    handleInputChange("shortName", e.target.value)
                  }
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Job Ref No.
                </label>
                <Input
                  value={formData.jobRefNo}
                  onChange={(e) =>
                    handleInputChange("jobRefNo", e.target.value)
                  }
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Client
                </label>
                <Select
                  value={formData.client}
                  onChange={(e) => handleInputChange("client", e.target.value)}
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.clientName}>
                      {client.clientName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Flat Billing Rate
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-foreground-muted))]">
                    $
                  </span>
                  <Input
                    className="pl-7"
                    value={formData.flatBillingRate}
                    onChange={(e) =>
                      handleInputChange("flatBillingRate", e.target.value)
                    }
                    placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1 flex items-center gap-1">
                  Alert & Notifications Recipient
                  <Info className="w-3 h-3 text-blue-500" />
                </label>
                <Select
                  value={formData.alertRecipient}
                  onChange={(e) =>
                    handleInputChange("alertRecipient", e.target.value)
                  }
                >
                  <option value="">Select</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1 flex items-center gap-1">
                  Export/External ID
                  <Info className="w-3 h-3 text-blue-500" />
                </label>
                <Input
                  value={formData.exportId}
                  onChange={(e) =>
                    handleInputChange("exportId", e.target.value)
                  }
                  placeholder=""
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Region
                </label>
                <Input
                  value={formData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  placeholder=""
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--color-foreground-secondary))]">
                  <input
                    type="checkbox"
                    className="rounded border-[hsl(var(--color-border))]"
                  />
                  <span>No break time deduction defined.</span>
                  <a href="#" className="text-blue-600 hover:underline">
                    Manage automatic break time deductions
                  </a>
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                  Remind Employees for Upcoming Shifts
                </label>
                <Select
                  value={formData.remindEmployees}
                  onChange={(e) =>
                    handleInputChange("remindEmployees", e.target.value)
                  }
                  className="max-w-xs"
                >
                  <option value="2 hours before">2 hours before</option>
                  <option value="1 hour before">1 hour before</option>
                  <option value="30 minutes before">30 minutes before</option>
                </Select>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-3 flex items-center gap-1">
                Scheduling
                <Info className="w-4 h-4 text-blue-500" />
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                    Default Start Time
                  </label>
                  <Select
                    value={formData.defaultStartTime}
                    onChange={(e) =>
                      handleInputChange("defaultStartTime", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                    Default End Time
                  </label>
                  <Select
                    value={formData.defaultEndTime}
                    onChange={(e) =>
                      handleInputChange("defaultEndTime", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                    Default Shift Duration
                  </label>
                  <Select
                    value={formData.defaultShiftDuration}
                    onChange={(e) =>
                      handleInputChange("defaultShiftDuration", e.target.value)
                    }
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
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "address"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-[hsl(var(--color-card))] text-purple-600 border border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "contact"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-[hsl(var(--color-card))] text-purple-600 border border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Contact Information</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("access")}
                  className={`flex items-center justify-center md:justify-start gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${
                    activeTab === "access"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-[hsl(var(--color-card))] text-purple-600 border border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden sm:inline">Access Codes</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 border border-[hsl(var(--color-border))] rounded-lg p-6 bg-[hsl(var(--color-card))]">
                {activeTab === "address" && (
                  <div>
                    <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] mb-4">
                      Address
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Address
                        </label>
                        <Input
                          value={formData.address}
                          onChange={(e) =>
                            handleInputChange("address", e.target.value)
                          }
                          placeholder="Enter a location"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          State
                        </label>
                        <Select
                          value={formData.state}
                          onChange={(e) =>
                            handleInputChange("state", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="QLD">QLD</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Town/Suburb
                        </label>
                        <Input
                          value={formData.townSuburb}
                          onChange={(e) =>
                            handleInputChange("townSuburb", e.target.value)
                          }
                          placeholder="Enter Suburb, Town, City or Postcode"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Postal Code
                        </label>
                        <Input
                          value={formData.postalCode}
                          onChange={(e) =>
                            handleInputChange("postalCode", e.target.value)
                          }
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* GeoLocation Section */}
                    <div className="border-t border-[hsl(var(--color-border))] pt-6 mt-6">
                      <h4 className="text-sm font-semibold text-[hsl(var(--color-foreground-muted))] mb-4">
                        GeoLocation
                      </h4>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Timezone
                        </label>
                        <Select
                          value={formData.timezone}
                          onChange={(e) =>
                            handleInputChange("timezone", e.target.value)
                          }
                          className="max-w-md"
                        >
                          <option value="Australia/Perth">
                            (UTC+08:00) Perth
                          </option>
                          <option value="Australia/Darwin">
                            (UTC+09:30) Darwin
                          </option>
                          <option value="Australia/Brisbane">
                            (UTC+10:00) Brisbane
                          </option>
                          <option value="Australia/Adelaide">
                            (UTC+10:30) Adelaide
                          </option>
                          <option value="Australia/Sydney">
                            (UTC+10:00) Sydney
                          </option>
                          <option value="Australia/Melbourne">
                            (UTC+10:00) Melbourne
                          </option>
                          <option value="Australia/Hobart">
                            (UTC+10:00) Hobart
                          </option>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                            Latitude
                          </label>
                          <Input
                            value={formData.latitude}
                            onChange={(e) =>
                              handleInputChange("latitude", e.target.value)
                            }
                            placeholder=""
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                            Longitude
                          </label>
                          <Input
                            value={formData.longitude}
                            onChange={(e) =>
                              handleInputChange("longitude", e.target.value)
                            }
                            placeholder=""
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mb-6">
                        <Button
                          variant="outline"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Get Map Address
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View Map
                        </Button>
                      </div>

                      {/* GEOFence Radius Slider */}
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-3">
                          GEOFence Radius
                        </label>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-[hsl(var(--color-foreground-secondary))] w-16">
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
                              className="w-full h-2 bg-[hsl(var(--color-border))] rounded-lg appearance-none cursor-pointer slider-thumb"
                              style={{
                                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(geoFenceRadius / 5) * 100}%, hsl(var(--color-border)) ${(geoFenceRadius / 5) * 100}%, hsl(var(--color-border)) 100%)`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[hsl(var(--color-foreground-secondary))] w-16 text-right">
                            5.0 km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "contact" && (
                  <div>
                    <h3 className="text-base font-semibold text-[hsl(var(--color-foreground))] mb-4">
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Contact Person
                        </label>
                        <Input placeholder="Enter contact person name" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Position/Title
                        </label>
                        <Input placeholder="Enter position" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Phone Number
                        </label>
                        <Input type="tel" placeholder="Enter phone number" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Mobile Number
                        </label>
                        <Input type="tel" placeholder="Enter mobile number" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Email Address
                        </label>
                        <Input type="email" placeholder="Enter email address" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                          Additional Notes
                        </label>
                        <textarea
                          className="flex w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] ring-offset-white placeholder:text-[hsl(var(--color-foreground-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none"
                          placeholder="Enter any additional contact information or notes"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "access" && (
                  <div>
                    {/* New Access Code Section */}
                    <div className="border border-[hsl(var(--color-border))] rounded-lg mb-6">
                      <button
                        onClick={() =>
                          setAccessCodeExpanded(!accessCodeExpanded)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-border))] transition-colors rounded-lg border-b border-[hsl(var(--color-border))]"
                      >
                        <div className="flex items-center gap-2 text-blue-600">
                          <Key className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            New Access Code
                          </span>
                        </div>
                        {accessCodeExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[hsl(var(--color-foreground-secondary))]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[hsl(var(--color-foreground-secondary))]" />
                        )}
                      </button>

                      {accessCodeExpanded && (
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
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
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
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
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAccessCode(!showAccessCode)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground-secondary))]"
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
                            <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
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
                              className="flex w-full rounded-md border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] ring-offset-white placeholder:text-[hsl(var(--color-foreground-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-2">
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
                                  className="w-4 h-4 text-blue-600 border-[hsl(var(--color-border))] focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
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
                                  className="w-4 h-4 text-red-600 border-[hsl(var(--color-border))] focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
                                  No
                                </span>
                              </label>
                            </div>
                          </div>

                          <div className="border-t border-[hsl(var(--color-border))] pt-4 mt-4">
                            <h4 className="text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-3">
                              Employees can see the access codes
                            </h4>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-[hsl(var(--color-foreground))]">
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
                                      className="w-4 h-4 text-blue-600 border-[hsl(var(--color-border))] focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
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
                                      className="w-4 h-4 text-red-600 border-[hsl(var(--color-border))] focus:ring-red-500"
                                    />
                                    <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
                                      No
                                    </span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="text-sm text-[hsl(var(--color-foreground))]">
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
                                      className="w-4 h-4 text-blue-600 border-[hsl(var(--color-border))] focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
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
                                      className="w-4 h-4 text-red-600 border-[hsl(var(--color-border))] focus:ring-red-500"
                                    />
                                    <span className="ml-2 text-sm text-[hsl(var(--color-foreground))]">
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
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
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
    </div>
  );
}
