import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";
import { leaveApi, employeeApi } from "../../lib/api";

export default function AddLeaveModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    fullDay: true,
    notes: "",
  });
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    employeeApi
      .getAll({ isActive: true, limit: 200 })
      .then((res) => {
        const list = res.data.data?.employees || res.data.data || [];
        setEmployees(list);
      })
      .catch(() => {});
  }, [open]);

  const handleMouseDown = (e) => {
    if (e.target.closest(".modal-header")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };
  const handleMouseMove = (e) => {
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count || 1;
  };

  const handleSubmit = async (autoApprove = false) => {
    if (!formData.employeeId) return toast.error("Please select an employee");
    if (!formData.leaveType) return toast.error("Please select a leave type");
    if (!formData.startDate) return toast.error("Please select a start date");
    if (!formData.endDate) return toast.error("Please select an end date");
    if (new Date(formData.endDate) < new Date(formData.startDate))
      return toast.error("End date must be on or after start date");

    try {
      setSubmitting(true);
      const res = await leaveApi.create(formData);
      const leaveId = res.data.data._id;

      if (autoApprove) {
        await leaveApi.approve(leaveId, "Approved by admin on creation");
        toast.success("Leave request created and approved");
      } else {
        toast.success("Leave request created");
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create leave request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const days = calcDays();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="fixed bg-[hsl(var(--color-card))] rounded-lg shadow-xl w-full max-w-2xl"
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: "translate(-50%, -50%)",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header */}
        <div
          className="modal-header flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--color-border))] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">
            New Leave Request
          </h2>
          <button onClick={onClose} className="text-[hsl(var(--color-foreground-secondary))] hover:text-[hsl(var(--color-foreground))]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {/* Employee + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              >
                <option value="">Select Employee...</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              >
                <option value="">Select Type...</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Full day + days count */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fullDay}
                onChange={(e) => setFormData({ ...formData, fullDay: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-[hsl(var(--color-foreground))]">Full Day(s)</span>
            </label>
            {days > 0 && (
              <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                <strong>{days}</strong> working day{days !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes / Reason</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter reason for leave..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[hsl(var(--color-border))] flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-dark))] text-white"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {submitting ? "Saving..." : "Save & Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}
