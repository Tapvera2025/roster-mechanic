import { useState, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { RadioGroup, RadioGroupItem } from "../ui/RadioGroup";
import { Switch } from "../ui/Switch";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";

export default function AddLeaveModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    employee: "",
    leaveCategory: "",
    period: "single",
    fullDay: true,
    leaveDays: 0,
    applyTo: "",
    leaveBreakdown: "",
    notes: "",
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const modalRef = useRef(null);

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

  const handleSubmit = (approve = false) => {
    console.log("Form submitted:", { ...formData, approve });
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="fixed bg-[hsl(220,15%,14%)] rounded-lg shadow-xl w-full max-w-5xl border border-[hsl(220,15%,20%)]"
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: "translate(-50%, -50%)",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header flex items-center justify-between px-6 py-4 border-b border-[hsl(220,15%,20%)] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold text-gray-100">
            New Leave Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[hsl(220,15%,20%)]">
          <div className="px-6">
            <button className="px-4 py-3 text-sm font-medium text-gray-100 border-b-2 border-orange-500">
              Leave Request
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Employee and Leave Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  id="employee"
                  value={formData.employee}
                  onChange={(e) =>
                    setFormData({ ...formData, employee: e.target.value })
                  }
                >
                  <option value="">Select Employee...</option>
                  <option value="john_doe">John Doe</option>
                  <option value="jane_smith">Jane Smith</option>
                  <option value="bob_johnson">Bob Johnson</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveCategory">Leave Category</Label>
                <Select
                  id="leaveCategory"
                  value={formData.leaveCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveCategory: e.target.value })
                  }
                >
                  <option value="">Select Type...</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </Select>
              </div>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label>Period</Label>
              <RadioGroup className="flex gap-6">
                <RadioGroupItem
                  id="single"
                  name="period"
                  value="single"
                  checked={formData.period === "single"}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                >
                  <label
                    htmlFor="single"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Single Day
                  </label>
                </RadioGroupItem>
                <RadioGroupItem
                  id="multiple"
                  name="period"
                  value="multiple"
                  checked={formData.period === "multiple"}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                >
                  <label
                    htmlFor="multiple"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Multiple Days
                  </label>
                </RadioGroupItem>
              </RadioGroup>
            </div>

            {/* Full Day and Leave Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullDay">Full Day</Label>
                <Switch
                  id="fullDay"
                  checked={formData.fullDay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, fullDay: checked })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label>Leave Days</Label>
                <span className="text-sm text-gray-400">
                  {formData.leaveDays} Day(s)
                </span>
              </div>
            </div>

            {/* Apply Leave Category */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button className="text-orange-500 hover:text-orange-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <Select
                  value={formData.applyTo}
                  onChange={(e) =>
                    setFormData({ ...formData, applyTo: e.target.value })
                  }
                  className="flex-1"
                >
                  <option value="">
                    Apply Leave Category to All or Selected Records
                  </option>
                  <option value="all">All Records</option>
                  <option value="selected">Selected Records</option>
                </Select>
              </div>
            </div>

            {/* Leave Breakdown */}
            <div className="border border-[hsl(220,15%,20%)] rounded-lg">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[hsl(220,15%,18%)]"
              >
                <span className="text-sm font-medium text-orange-500">
                  Leave Breakdown
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-orange-500 transition-transform ${
                    showBreakdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showBreakdown && (
                <div className="px-4 py-3 border-t border-[hsl(220,15%,20%)]">
                  <p className="text-sm text-gray-400">
                    Leave breakdown details will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Notes/Comments */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes/Comments</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter any additional notes or comments..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[hsl(220,15%,20%)] flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-300 border-[hsl(220,15%,25%)] hover:bg-[hsl(220,15%,18%)]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Save
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Save And Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
