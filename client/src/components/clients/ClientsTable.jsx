import { ArrowUpDown } from "lucide-react";
import ClientRow from "./ClientRow";
import MobileCard from "../ui/MobileCard";
import Badge from "../ui/Badge";

export default function ClientsTable({
  clients = [],
  loading = false,
  onClientClick,
}) {
  return (
    <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg sm:rounded-xl shadow-sm">
      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block table-container">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-[hsl(var(--color-surface-elevated))] border-b border-[hsl(var(--color-border))]">
            <tr className="text-[hsl(var(--color-foreground-secondary))] text-xs">
              <th className="px-2 sm:px-3 py-2 sm:py-3 text-center w-10 sm:w-12 sticky left-0 bg-[hsl(var(--color-surface-elevated))] z-[5]">
                <input
                  type="checkbox"
                  className="rounded border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                />
              </th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  Client Name
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap">
                State
              </th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap hidden md:table-cell">
                Invoicing Company
              </th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left">Status</th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap hidden lg:table-cell">
                Invoice Subject
              </th>

              <th className="px-2 sm:px-3 py-2 sm:py-3 text-left whitespace-nowrap hidden lg:table-cell">
                Invoice Template
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[hsl(var(--color-border))]">
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-8 text-center text-[hsl(var(--color-foreground-muted))]"
                >
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-8 text-center text-[hsl(var(--color-foreground-muted))]"
                >
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClientClick={onClientClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden p-3 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-[hsl(var(--color-foreground-muted))]">
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--color-foreground-muted))]">
            No clients found
          </div>
        ) : (
          clients.map((client) => (
            <MobileCard
              key={client.id}
              title={client.clientName}
              fields={[
                { label: 'State', value: client.state || 'N/A' },
                { label: 'Status', value: <Badge status={client.status} /> },
                { label: 'Invoicing Company', value: client.invoicingCompany || 'N/A' },
              ]}
              actions={[
                {
                  label: 'View Details',
                  variant: 'default',
                  onClick: () => onClientClick && onClientClick(client),
                },
              ]}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))] flex items-center justify-between">
        <div className="text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))]">
          Showing 1 to {clients.length} of {clients.length} entries
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
            Previous
          </button>

          <button className="px-3 py-1 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            1
          </button>

          <button className="px-3 py-1 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="md:hidden px-3 py-2 bg-[hsl(var(--color-surface-elevated))] border-t border-[hsl(var(--color-border))] text-center">
        <p className="text-xs text-[hsl(var(--color-foreground-muted))]">
          Scroll horizontally to view all columns
        </p>
      </div>
    </div>
  );
}
