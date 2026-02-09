import { useState, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { siteApi } from "../../lib/api";

export default function AddMultipleSitesModal({ onClose, onSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const [sites, setSites] = useState([
    {
      id: 1,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
    {
      id: 2,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
    {
      id: 3,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
    {
      id: 4,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
    {
      id: 5,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
    {
      id: 6,
      siteName: "",
      shortName: "",
      address: "",
      client: "",
      checked: false,
    },
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

  const handleAddMoreSites = () => {
    const newId = Math.max(...sites.map((s) => s.id)) + 1;
    setSites([
      ...sites,
      {
        id: newId,
        siteName: "",
        shortName: "",
        address: "",
        client: "",
        checked: false,
      },
    ]);
  };

  const handleDeleteSite = (id) => {
    setSites(sites.filter((site) => site.id !== id));
  };

  const handleSiteChange = (id, field, value) => {
    setSites(
      sites.map((site) =>
        site.id === id ? { ...site, [field]: value } : site,
      ),
    );
  };

  const handleCheckboxChange = (id) => {
    setSites(
      sites.map((site) =>
        site.id === id ? { ...site, checked: !site.checked } : site,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      // Filter out empty sites (sites with at least siteName and shortName filled)
      const validSites = sites.filter(
        (s) => s.siteName.trim() && s.shortName.trim(),
      );

      if (validSites.length === 0) {
        toast.error(
          "Please fill in at least one site with Name and Short Name",
        );
        return;
      }

      // Map to API format
      const payload = validSites.map((site) => ({
        siteLocationName: site.siteName,
        shortName: site.shortName,
        address: site.address,
        client: site.client || "No Client",
        status: "ACTIVE",
      }));

      const response = await siteApi.bulkCreate(payload);

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create sites");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={modalRef}
        className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-3xl shadow-2xl w-full max-w-6xl"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header - Draggable */}
        <div
          className="modal-header flex items-center justify-between px-6 py-4 border-b border-[hsl(220,15%,20%)] rounded-t-3xl cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-bold text-gray-100">Add Sites</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(220,15%,22%)]">
                  <th className="w-10 pb-3"></th>
                  <th className="text-left pb-3 px-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Site Name
                  </th>
                  <th className="text-left pb-3 px-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Short Name
                  </th>
                  <th className="text-left pb-3 px-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="text-left pb-3 px-2 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="w-10 pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site, index) => (
                  <tr
                    key={site.id}
                    className="border-b border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,16%)] transition-colors"
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={site.checked}
                        onChange={() => handleCheckboxChange(site.id)}
                        className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        placeholder="Site Name*"
                        value={site.siteName}
                        onChange={(e) =>
                          handleSiteChange(site.id, "siteName", e.target.value)
                        }
                        className={`bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500 ${
                          index === sites.length - 1
                            ? "border-orange-500 focus:border-orange-500"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        placeholder="Short Name*"
                        value={site.shortName}
                        onChange={(e) =>
                          handleSiteChange(site.id, "shortName", e.target.value)
                        }
                        className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        placeholder="Address*"
                        value={site.address}
                        onChange={(e) =>
                          handleSiteChange(site.id, "address", e.target.value)
                        }
                        className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100 placeholder-gray-500"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Select
                        value={site.client}
                        onChange={(e) =>
                          handleSiteChange(site.id, "client", e.target.value)
                        }
                        className="bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
                      >
                        <option value="">Select...</option>
                        <option value="internal">Internal Company Site</option>
                        <option value="qld-rail">Queensland Rail</option>
                        <option value="private">Private Client</option>
                      </Select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="p-1.5 text-orange-500 hover:bg-[hsl(220,15%,18%)] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add More Sites Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleAddMoreSites}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add More Sites
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(220,15%,20%)] bg-[hsl(220,15%,16%)] rounded-b-3xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)] disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
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
      `}</style>
    </div>
  );
}
