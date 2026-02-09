import Badge from "../ui/Badge";
import { MapPin, ChevronDown } from "lucide-react";

export default function SiteRow({ site }) {
  return (
    <tr className="hover:bg-[hsl(220,15%,16%)] transition-colors border-b border-[hsl(220,15%,20%)]">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] z-[5]">
        <input
          type="checkbox"
          className="rounded border-[hsl(220,15%,30%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
        />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-orange-500 hover:text-orange-400 hover:underline cursor-pointer whitespace-nowrap transition-colors">
        {site.siteLocationName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {site.shortName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {site.client}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-300 whitespace-nowrap">
        {site.state}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={site.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-gray-300">
        {site.expiryIn30Days}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        <button
          className="text-orange-500 hover:text-orange-400 transition-colors"
          title="View on Map"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
        </button>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right sticky right-0 bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] z-[5] relative">
        <button className="px-2 sm:px-3 py-1.5 bg-[hsl(220,15%,18%)] border border-[hsl(220,15%,30%)] rounded text-xs sm:text-sm text-gray-300 hover:bg-[hsl(220,15%,22%)] transition-colors flex items-center gap-1">
          Actions
          <ChevronDown className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
