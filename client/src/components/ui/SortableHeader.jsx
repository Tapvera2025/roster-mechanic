import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

/**
 * Sortable table header component
 * @param {string} label - The header label text
 * @param {string} sortKey - The key used for sorting
 * @param {Function} onSort - Callback when header is clicked
 * @param {string|null} sortDirection - Current sort direction ('asc', 'desc', or null)
 * @param {string} className - Additional CSS classes
 */
export default function SortableHeader({
  label,
  sortKey,
  onSort,
  sortDirection,
  className = "",
}) {
  const handleClick = () => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 hover:text-[hsl(var(--color-foreground))] transition-colors ${className}`}
    >
      <span className="whitespace-nowrap">{label}</span>
      {sortDirection === 'asc' ? (
        <ArrowUp className="w-3 h-3 text-blue-600" />
      ) : sortDirection === 'desc' ? (
        <ArrowDown className="w-3 h-3 text-blue-600" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
}
