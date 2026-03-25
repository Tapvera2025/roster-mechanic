import { useState, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { clientApi } from "../../lib/api";

export default function AddMultipleClientsModal({ onClose, onSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const [clients, setClients] = useState([
    { id: 1, clientName: "", checked: false },
    { id: 2, clientName: "", checked: false },
    { id: 3, clientName: "", checked: false },
    { id: 4, clientName: "", checked: false },
    { id: 5, clientName: "", checked: false },
  ]);

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

  const handleAddMoreClients = () => {
    const newId = Math.max(...clients.map((c) => c.id)) + 1;
    setClients([
      ...clients,
      { id: newId, clientName: "", checked: false },
    ]);
  };

  const handleDeleteClient = (id) => {
    setClients(clients.filter((client) => client.id !== id));
  };

  const handleClientChange = (id, field, value) => {
    setClients(
      clients.map((client) =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };

  const handleCheckboxChange = (id) => {
    setClients(
      clients.map((client) =>
        client.id === id ? { ...client, checked: !client.checked } : client
      )
    );
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      // Filter out empty clients (clients with at least clientName filled)
      const validClients = clients.filter(c =>
        c.clientName.trim()
      );

      if (validClients.length === 0) {
        toast.error('Please fill in at least one client name');
        return;
      }

      // Map to API format
      const payload = validClients.map(client => ({
        clientName: client.clientName,
        status: 'ACTIVE'
      }));

      await clientApi.bulkCreate(payload);

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create clients');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header - Draggable */}
        <div
          className="modal-header flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold text-gray-800">Add Clients</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Clients</h3>

          <div className="space-y-3">
            {clients.map((client, index) => (
              <div key={client.id} className="flex items-center gap-3">
                <Input
                  placeholder="Client Name*"
                  value={client.clientName}
                  onChange={(e) =>
                    handleClientChange(client.id, "clientName", e.target.value)
                  }
                  className={`flex-1 ${index === clients.length - 1 ? "border-blue-400" : ""}`}
                />
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add More Clients Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleAddMoreClients}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Clients
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
