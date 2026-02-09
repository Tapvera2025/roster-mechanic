import { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import toast from "react-hot-toast";

export default function AddShiftModal({
  isOpen,
  onClose,
  onSave,
  employees = [],
  sites = [],
  selectedSite,
  selectedDate,
  selectedEmployeeId = null,
}) {
  const [activeTab, setActiveTab] = useState("schedule");
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
    publishAndNotify: false,
    task: "",
    jobRefNo: "",
    notes: "",
    notesToEmployee: "",
    certLicense: "",
  });

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

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return "0.00";
    const [sh, sm] = formData.startTime.split(":").map(Number);
    const [eh, em] = formData.endTime.split(":").map(Number);

    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    mins -= formData.breakDuration || 0;

    return (mins / 60).toFixed(2);
  };

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.siteId) {
      toast.error("Please select a site");
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Please fill all required fields");
      return;
    }

    onSave({
      ...formData,
      startTime: new Date(
        `${formData.date}T${formData.startTime}:00`,
      ).toISOString(),
      endTime: new Date(
        `${formData.date}T${formData.endTime}:00`,
      ).toISOString(),
      breakDuration: formData.breakDuration || 0,
    });
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(220,15%,20%)]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-100">
              Add {selectedEmployee ? selectedEmployee.position : "Shift"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[hsl(220,15%,18%)] text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Site */}
            <div>
              <Label className="text-gray-300">Site *</Label>
              <Select
                value={formData.siteId}
                onChange={(e) => handleChange("siteId", e.target.value)}
                className="mt-1"
              >
                <option value="">Select Site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName} – {s.siteLocationName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Employee */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  className="mt-1"
                >
                  <option value="">Open Shift</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} – {e.position}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Position</Label>
                <Input
                  value={selectedEmployee?.position || "N/A"}
                  disabled
                  className="mt-1 bg-[hsl(220,15%,18%)] text-gray-400"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-gray-300">Start</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-gray-300">End</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-gray-300">Duration</Label>
                <div className="mt-1 px-3 py-2 rounded-md bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,22%)] text-gray-100 font-medium">
                  {calculateDuration()} hrs
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-[hsl(220,15%,20%)] pt-4">
              <div className="flex gap-2 mb-4">
                {[
                  { id: "schedule", label: "Schedule" },
                  { id: "notes", label: "Notes" },
                  { id: "notesToEmployee", label: "Notes to Employee" },
                  { id: "certLicense", label: "Cert / License" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === t.id
                        ? "bg-orange-600 text-white"
                        : "bg-[hsl(220,15%,18%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab !== "schedule" && (
                <Textarea
                  rows={4}
                  value={formData[activeTab]}
                  onChange={(e) => handleChange(activeTab, e.target.value)}
                  placeholder={`Enter ${activeTab.replace(/([A-Z])/g, " $1")}`}
                />
              )}

              {activeTab === "schedule" && (
                <div className="text-sm text-gray-400 italic">
                  Schedule preview / calendar integration goes here
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[hsl(220,15%,20%)] bg-[hsl(220,15%,16%)]">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
