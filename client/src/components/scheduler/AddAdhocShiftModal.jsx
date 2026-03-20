import { useState, useEffect } from "react";
import { X, Clock, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { schedulerApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function AddAdhocShiftModal({
  isOpen,
  onClose,
  onSave,
  sites = [],
  selectedSite,
  selectedDate,
  selectedEmployeeId = null,
}) {
  const [activeTab, setActiveTab] = useState("schedule");
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: selectedEmployeeId || "",
    siteId: selectedSite || "",
    date: selectedDate || new Date().toISOString().split("T")[0],
    startTime: "06:00",
    endTime: "14:00",
    breakDuration: 30,
    shiftType: "REGULAR",
    status: "SCHEDULED",
    chargedToClient: false,
    specialShift: false,
    task: "",
    jobRefNo: "",
    notes: "",
    notesToEmployee: "",
    certLicense: "",
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        employeeId: selectedEmployeeId || "",
        siteId: selectedSite || "",
        date: selectedDate || new Date().toISOString().split("T")[0],
      }));
    }
  }, [isOpen, selectedEmployeeId, selectedSite, selectedDate]);

  // Fetch employees when site is selected
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!formData.siteId) {
        setEmployees([]);
        return;
      }

      try {
        setLoadingEmployees(true);
        const response = await schedulerApi.getSiteEmployees(formData.siteId);
        const employeesData = response.data.data;

        // Transform employee data
        const transformedEmployees = employeesData.map((emp) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          position: emp.position,
        }));

        setEmployees(transformedEmployees);
      } catch (err) {
        toast.error("Failed to load employees for this site");
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [formData.siteId]);

  // Calculate shift duration
  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return "0.00";

    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const [endHour, endMin] = formData.endTime.split(":").map(Number);

    let totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts

    totalMinutes -= formData.breakDuration || 0;

    const hours = (totalMinutes / 60).toFixed(2);
    return hours;
  };

  const handleChange = (field, value) => {
    // If site changes, clear employee selection
    if (field === "siteId") {
      setFormData((prev) => ({ ...prev, [field]: value, employeeId: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.siteId) {
      toast.error("Please select a site");
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create ISO datetime strings
    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    const shiftData = {
      employeeId: formData.employeeId || null,
      siteId: formData.siteId,
      date: formData.date,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      shiftType: formData.shiftType,
      status: "SCHEDULED",
      notes: formData.notes?.trim() || null,
      breakDuration: formData.breakDuration || 0,
      chargedToClient: formData.chargedToClient || false,
      specialShift: formData.specialShift || false,
      task: formData.task?.trim() || null,
      jobRefNo: formData.jobRefNo?.trim() || null,
      isAdhoc: true,
    };

    onSave(shiftData);
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);
  const duration = calculateDuration();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[hsl(var(--color-card))] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Orange for adhoc */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--color-border))] bg-gradient-to-r from-orange-500 to-orange-600">
          <h2 className="text-lg font-semibold text-white">
            Add Adhoc{" "}
            {selectedEmployee
              ? selectedEmployee.position || "Employee"
              : "Shift"}{" "}
            Shift
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Adhoc Warning Banner */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              Adhoc Shift - Flexible Assignment
            </p>
            <p className="text-xs text-orange-700 mt-1">
              This shift allows overlapping assignments and is useful for emergency coverage.
              The employee will be notified immediately upon creation.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Site */}
            <div>
              <Label>Site *</Label>
              <Select
                value={formData.siteId}
                onChange={(e) => handleChange("siteId", e.target.value)}
                className="mt-1"
                required
              >
                <option value="">Select Site...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.shortName} - {site.siteLocationName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Employee and Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee</Label>
                <Select
                  value={formData.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  className="mt-1"
                  disabled={!formData.siteId || loadingEmployees}
                >
                  {!formData.siteId ? (
                    <option value="">Select site first...</option>
                  ) : loadingEmployees ? (
                    <option value="">Loading employees...</option>
                  ) : (
                    <>
                      <option value="">Open Shift</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} - {emp.position}
                        </option>
                      ))}
                    </>
                  )}
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  value={selectedEmployee?.position || "N/A"}
                  disabled
                  className="mt-1 bg-[hsl(var(--color-surface-elevated))]"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {/* Time and Break */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Break (mins)</Label>
                <Input
                  type="number"
                  value={formData.breakDuration}
                  onChange={(e) =>
                    handleChange("breakDuration", parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label>Duration</Label>
                <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-[hsl(var(--color-border))] rounded-md bg-[hsl(var(--color-surface-elevated))]">
                  <span className="font-medium text-[hsl(var(--color-foreground))]">
                    {duration}
                  </span>
                  <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                    Hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Status - Always Confirmed for adhoc */}
            <div>
              <Label>Status</Label>
              <div className="mt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="SCHEDULED"
                    checked={formData.status === "SCHEDULED"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-sm text-[hsl(var(--color-foreground))]">
                    Confirmed
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="tentative"
                    checked={formData.status === "tentative"}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-sm text-[hsl(var(--color-foreground))]">
                    Tentative
                  </span>
                </label>
              </div>
            </div>

            {/* Options Row - Removed Publish & Notify (always true for adhoc) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label className="mb-0">Charged To Client</Label>
                <button
                  type="button"
                  onClick={() =>
                    handleChange("chargedToClient", !formData.chargedToClient)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.chargedToClient
                      ? "bg-orange-500"
                      : "bg-[hsl(var(--color-surface-elevated))]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.chargedToClient
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Label className="mb-0">Special Shift</Label>
                <button
                  type="button"
                  onClick={() =>
                    handleChange("specialShift", !formData.specialShift)
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.specialShift
                      ? "bg-orange-500"
                      : "bg-[hsl(var(--color-surface-elevated))]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.specialShift ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Shift Type, Task, Job Ref */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Shift Type</Label>
                <Select
                  value={formData.shiftType}
                  onChange={(e) => handleChange("shiftType", e.target.value)}
                  className="mt-1"
                >
                  <option value="REGULAR">Normal Shift</option>
                  <option value="OVERTIME">Overtime</option>
                  <option value="ON_CALL">On Call</option>
                  <option value="NIGHT">Night Shift</option>
                </Select>
              </div>
              <div>
                <Label>Task</Label>
                <Input
                  value={formData.task}
                  onChange={(e) => handleChange("task", e.target.value)}
                  className="mt-1"
                  placeholder="Select task..."
                />
              </div>
              <div>
                <Label>Job Ref-No</Label>
                <Input
                  value={formData.jobRefNo}
                  onChange={(e) => handleChange("jobRefNo", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-[hsl(var(--color-border))] pt-4">
              <div className="flex gap-2 mb-4">
                {["schedule", "notes", "notesToEmployee", "certLicense"].map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab
                          ? "bg-orange-500 text-white"
                          : "bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-border))]"
                      }`}
                    >
                      {tab === "schedule" && "Schedule"}
                      {tab === "notes" && "Notes"}
                      {tab === "notesToEmployee" && "Notes To Employee"}
                      {tab === "certLicense" && "Cert/License"}
                    </button>
                  ),
                )}
              </div>

              {/* Tab Content */}
              <div className="min-h-[100px]">
                {activeTab === "schedule" && (
                  <div className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                    Schedule view - Calendar integration can be added here
                  </div>
                )}
                {activeTab === "notes" && (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Add notes about this adhoc shift..."
                    rows={4}
                  />
                )}
                {activeTab === "notesToEmployee" && (
                  <Textarea
                    value={formData.notesToEmployee}
                    onChange={(e) =>
                      handleChange("notesToEmployee", e.target.value)
                    }
                    placeholder="Add notes for the employee..."
                    rows={4}
                  />
                )}
                {activeTab === "certLicense" && (
                  <Textarea
                    value={formData.certLicense}
                    onChange={(e) =>
                      handleChange("certLicense", e.target.value)
                    }
                    placeholder="Add certification or license requirements..."
                    rows={4}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))]">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
              Save Adhoc Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
