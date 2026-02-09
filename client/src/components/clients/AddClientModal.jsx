import { useState, useRef } from "react";
import { X, Building2, Save, ChevronDown, Plus, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { clientApi } from "../../lib/api";

export default function AddClientModal({ onClose, onSuccess, client = null }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // API state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    clientName: client?.clientName || "",
    state: client?.state || "",
    invoicingCompany: client?.invoicingCompany || "",
    status: client?.status || "Active",
    invoiceSubject: client?.invoiceSubject || "",
    invoiceTemplate: client?.invoiceTemplate || "",
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
        status: formData.status === "Active" ? "ACTIVE" : "INACTIVE",
      };

      if (client) {
        // Update existing client
        await clientApi.update(client.id, payload);
        toast.success("Client updated successfully");
      } else {
        // Create new client
        await clientApi.create(payload);
        toast.success("Client created successfully");
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
          `Failed to ${client ? "update" : "create"} client`,
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
        className="bg-[hsl(var(--color-card))] rounded-lg w-full max-w-4xl my-4 flex flex-col shadow-2xl"
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
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--color-foreground-secondary))]" />
            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--color-foreground))]">
              {client ? "Edit Client" : "Client Details"}
            </h2>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {!client && (
              <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-pink-600 border border-pink-600 rounded hover:bg-pink-50 transition-colors flex items-center gap-1 sm:gap-2">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Client</span>
              </button>
            )}
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
        <div className="overflow-y-auto p-6">
          {/* Client Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                Client Name *
              </label>
              <Input
                value={formData.clientName}
                onChange={(e) =>
                  handleInputChange("clientName", e.target.value)
                }
                placeholder="Enter client name"
              />
              {errors.clientName && (
                <p className="text-xs text-red-600 mt-1">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                State
              </label>
              <Select
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
              >
                <option value="">Select State</option>
                <option value="QLD">QLD</option>
                <option value="NSW">NSW</option>
                <option value="VIC">VIC</option>
                <option value="SA">SA</option>
                <option value="WA">WA</option>
                <option value="TAS">TAS</option>
                <option value="NT">NT</option>
                <option value="ACT">ACT</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                Invoicing Company
              </label>
              <Input
                value={formData.invoicingCompany}
                onChange={(e) =>
                  handleInputChange("invoicingCompany", e.target.value)
                }
                placeholder="Enter invoicing company"
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
                Invoice Subject
              </label>
              <Input
                value={formData.invoiceSubject}
                onChange={(e) =>
                  handleInputChange("invoiceSubject", e.target.value)
                }
                placeholder="Enter invoice subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground-secondary))] mb-1">
                Invoice Template
              </label>
              <Select
                value={formData.invoiceTemplate}
                onChange={(e) =>
                  handleInputChange("invoiceTemplate", e.target.value)
                }
              >
                <option value="">Select Template</option>
                <option value="Standard Template">Standard Template</option>
                <option value="Retail Template">Retail Template</option>
                <option value="IT Template">IT Template</option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
