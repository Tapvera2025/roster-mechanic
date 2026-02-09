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
    <div className="bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[hsl(220,15%,16%)] border-b border-[hsl(220,15%,22%)]">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {column}
                    <button className="hover:bg-[hsl(220,15%,22%)] rounded p-0.5">
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
          <tbody className="bg-[hsl(220,15%,14%)] divide-y divide-[hsl(220,15%,20%)]">
            {leaveRequests && leaveRequests.length > 0 ? (
              leaveRequests.map((request, index) => (
                <tr key={index} className="hover:bg-[hsl(220,15%,16%)]">
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.requestedBy}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.dateSubmitted}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.periodInHours}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.leaveStart}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.leaveEnd}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === "Approved"
                          ? "bg-green-900/50 text-green-400"
                          : request.status === "Declined"
                          ? "bg-red-900/50 text-red-400"
                          : request.status === "Awaiting"
                          ? "bg-amber-900/50 text-amber-400"
                          : "bg-gray-700/50 text-gray-400"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100">
                    <div className="max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.attachment && (
                      <button className="text-orange-500 hover:text-orange-400">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    {request.actionedBy || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-100 whitespace-nowrap">
                    <button className="p-1 hover:bg-[hsl(220,15%,18%)] rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-500"
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
