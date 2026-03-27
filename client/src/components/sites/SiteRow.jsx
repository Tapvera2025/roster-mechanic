import Badge from "../ui/Badge";
import { MapPin, ChevronDown } from "lucide-react";

export default function SiteRow({ site, onSiteClick, onMapClick }) {
  const handleClick = () => {
    if (onSiteClick) {
      onSiteClick(site);
    }
  };

  const handleMapClick = (e) => {
    e.stopPropagation();
    if (onMapClick) {
      onMapClick(site);
    }
  };

  return (
    <tr className="hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] z-[5]">
        <input
          type="checkbox"
          className="rounded border-[hsl(var(--color-border))]"
        />
      </td>
      <td
        className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
        onClick={handleClick}
      >
        {site.siteLocationName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden md:table-cell">
        {site.shortName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden lg:table-cell">
        {site.client}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-[hsl(var(--color-foreground))] whitespace-nowrap hidden md:table-cell">
        {site.state}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={site.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-[hsl(var(--color-foreground))] hidden lg:table-cell">
        {site.expiryIn30Days}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center hidden md:table-cell">
        <button
          onClick={handleMapClick}
          className="touch-target text-blue-600 hover:text-blue-700 transition-colors"
          title="View on Map"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
        </button>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right sticky right-0 bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] z-[5] relative">
        <button className="touch-target px-2 sm:px-3 py-1.5 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded text-xs sm:text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-1">
          Actions
          <ChevronDown className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
