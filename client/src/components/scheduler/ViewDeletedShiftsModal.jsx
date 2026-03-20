import { useState, useEffect } from "react";
import { X, Calendar, MapPin, User, Clock, Trash2, RotateCcw } from "lucide-react";
import { shiftApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function ViewDeletedShiftsModal({ onClose, siteId }) {
  const [deletedShifts, setDeletedShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetchDeletedShifts();
  }, [siteId]);

  const fetchDeletedShifts = async () => {
    try {
      setLoading(true);
      const response = await shiftApi.getDeleted(siteId);
      setDeletedShifts(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch deleted shifts:", err);
      toast.error("Failed to load deleted shifts");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (shiftId) => {
    try {
      setRestoring(shiftId);
      await shiftApi.restore(shiftId);
      toast.success("Shift restored successfully");
      // Remove from list after restore
      setDeletedShifts(deletedShifts.filter(shift => shift._id !== shiftId));
    } catch (err) {
      console.error("Failed to restore shift:", err);
      toast.error(err.response?.data?.message || "Failed to restore shift");
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (shiftId) => {
    if (!confirm("Are you sure you want to permanently delete this shift? This action cannot be undone.")) {
      return;
    }

    try {
      await shiftApi.permanentDelete(shiftId);
      toast.success("Shift permanently deleted");
      setDeletedShifts(deletedShifts.filter(shift => shift._id !== shiftId));
    } catch (err) {
      console.error("Failed to permanently delete shift:", err);
      toast.error(err.response?.data?.message || "Failed to delete shift");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[hsl(var(--color-card))] rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--color-border))]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-[hsl(var(--color-foreground))]">
              Deleted Shifts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--color-surface-elevated))] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[hsl(var(--color-foreground-muted))]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : deletedShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trash2 className="w-16 h-16 text-[hsl(var(--color-foreground-muted))] mb-4" />
              <p className="text-lg text-[hsl(var(--color-foreground-secondary))]">
                No deleted shifts found
              </p>
              <p className="text-sm text-[hsl(var(--color-foreground-muted))] mt-2">
                Deleted shifts will appear here for 30 days before being permanently removed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedShifts.map((shift) => (
                <div
                  key={shift._id}
                  className="border border-[hsl(var(--color-border))] rounded-lg p-4 hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Shift Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
                            {formatDate(shift.date)}
                          </p>
                          <p className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">
                            {shift.site?.siteLocationName || "N/A"}
                          </p>
                          <p className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                            {shift.position || "No position specified"}
                          </p>
                        </div>
                      </div>

                      {shift.employees && shift.employees.length > 0 && (
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-[hsl(var(--color-foreground))]">
                              {shift.employees
                                .map((emp) => `${emp.firstName} ${emp.lastName}`)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      )}

                      {shift.deletedAt && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-red-500">
                              Deleted on {formatDate(shift.deletedAt)} by{" "}
                              {shift.deletedBy?.firstName} {shift.deletedBy?.lastName}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      <button
                        onClick={() => handleRestore(shift._id)}
                        disabled={restoring === shift._id}
                        className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {restoring === shift._id ? "Restoring..." : "Restore"}
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(shift._id)}
                        disabled={restoring === shift._id}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--color-border))]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-border))] transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
