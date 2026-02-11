import { MoreVertical, Paperclip } from "lucide-react";

export default function LeaveTable({ leaveRequests }) {
  const columns = [
    "Requested By",
    "Type",
    "Date Submitted",
    "Period in Hours",
    "Leave Start",
    "Leave End",
    "Status",
    "Reason",
    "Attach",
    "Actioned By",
    "Actions",
  ];

  return (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-[hsl(var(--color-foreground-secondary))] uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    <button className="hover:bg-[hsl(var(--color-surface-elevated))] rounded p-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 10l5 5 5-5"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[hsl(var(--color-card))] divide-y divide-[hsl(var(--color-border))]">
            {leaveRequests && leaveRequests.length > 0 ? (
              leaveRequests.map((request, index) => (
                <tr key={index} className="hover:bg-[hsl(var(--color-surface-elevated))]">
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.requestedBy}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.dateSubmitted}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.periodInHours}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.leaveStart}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.leaveEnd}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Declined"
                          ? "bg-red-100 text-red-800"
                          : request.status === "Awaiting"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))]">
                    <div className="max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.attachment && (
                      <button className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-dark))]">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    {request.actionedBy || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--color-foreground))] whitespace-nowrap">
                    <button className="p-1 hover:bg-[hsl(var(--color-surface-elevated))] rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[hsl(var(--color-foreground-secondary))]"
                >
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
