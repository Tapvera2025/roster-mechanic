import { ArrowUpDown } from "lucide-react";
import ClientRow from "./ClientRow";

export default function ClientsTable({ clients = [], loading = false, onClientClick }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm">
      {/* Scrollable table container */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-gray-600 text-xs">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12 sticky left-0 bg-gray-50 z-[5]">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  Client Name
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">State</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">Invoicing Company</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Status</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">Invoice Subject</th>
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">Invoice Template</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <ClientRow key={client.id} client={client} onClientClick={onClientClick} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs sm:text-sm text-gray-600">
          Showing 1 to {clients.length} of {clients.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors">
            Previous
          </button>
          <button className="px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded">
            1
          </button>
          <button className="px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-2 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">Scroll horizontally to view all columns</p>
      </div>
    </div>
  );
}
