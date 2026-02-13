import { useState } from "react";
import { Check, X, Ban, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { leaveApi } from "../../lib/api";

const TYPE_LABELS = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  unpaid: "Unpaid Leave",
};

const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-800",
  approved:  "bg-green-100 text-green-800",
  declined:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function LeaveTable({ leaveRequests, onRefresh }) {
  const [actioningId, setActioningId] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [noteInput, setNoteInput] = useState("");

  const handleAction = async (id, action) => {
    try {
      setActioningId(id);
      if (action === "approve") {
        await leaveApi.approve(id, noteInput);
        toast.success("Leave approved — employee notified");
      } else if (action === "decline") {
        if (!noteInput.trim()) {
          toast.error("Please enter a reason for declining");
          return;
        }
        await leaveApi.decline(id, noteInput);
        toast.success("Leave declined — employee notified");
      } else if (action === "cancel") {
        await leaveApi.cancel(id);
        toast.success("Leave cancelled");
      }
      setExpandedNote(null);
      setNoteInput("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActioningId(null);
    }
  };

  const toggleNote = (id) => {
    setExpandedNote(expandedNote === id ? null : id);
    setNoteInput("");
  };

  return (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr>
              {/* Always visible */}
              <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Leave Type
              </th>
              {/* Hidden on mobile */}
              <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Start
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                End
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Days
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Submitted
              </th>
              {/* Always visible */}
              <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              {/* Hidden on mobile */}
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Notes
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Actioned By
              </th>
              {/* Always visible */}
              <th className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {leaveRequests && leaveRequests.length > 0 ? (
              leaveRequests.map((req) => {
                const id = req._id;
                const isActioning = actioningId === id;
                const isExpanded = expandedNote === id;
                const employee = req.employeeId;
                const employeeName = employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : "—";
                const actionedByName = req.actionedBy?.name || "—";

                return (
                  <>
                    <tr key={id} className="hover:bg-[hsl(var(--color-surface-elevated))]">
                      <td className="px-4 py-3 text-sm font-medium text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {employeeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {TYPE_LABELS[req.leaveType] || req.leaveType}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {fmt(req.startDate)}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {fmt(req.endDate)}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {req.periodDays ?? "—"}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {fmt(req.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] max-w-[160px] truncate">
                        {req.notes || "—"}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                        {actionedByName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-1">
                            <button
                              title="Approve"
                              onClick={() => handleAction(id, "approve")}
                              disabled={isActioning}
                              className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Decline (add note)"
                              onClick={() => toggleNote(id)}
                              disabled={isActioning}
                              className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Cancel"
                              onClick={() => handleAction(id, "cancel")}
                              disabled={isActioning}
                              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleNote(id)}
                              className="p-1 text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground-secondary))]"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : req.status === "approved" ? (
                          <button
                            title="Cancel"
                            onClick={() => handleAction(id, "cancel")}
                            disabled={isActioning}
                            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors text-xs"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-[hsl(var(--color-foreground-muted))]">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Inline decline note row */}
                    {isExpanded && req.status === "pending" && (
                      <tr key={`${id}-note`} className="bg-red-50">
                        <td colSpan={10} className="px-4 py-3">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              placeholder="Reason for declining (required)..."
                              className="flex-1 text-sm border border-red-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(id, "decline")}
                                disabled={isActioning}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                Confirm Decline
                              </button>
                              <button
                                onClick={() => toggleNote(null)}
                                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-secondary))]">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
