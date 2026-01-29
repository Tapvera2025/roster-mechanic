import Badge from "../ui/Badge";
import { MapPin, ChevronDown } from "lucide-react";

export default function SiteRow({ site, onSiteClick }) {
  const handleClick = () => {
    if (onSiteClick) {
      onSiteClick(site);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center sticky left-0 bg-white hover:bg-gray-50 z-[5]">
        <input type="checkbox" className="rounded border-gray-300" />
      </td>
      <td
        className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
        onClick={handleClick}
      >
        {site.siteLocationName}
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{site.shortName}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{site.client}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-gray-700 whitespace-nowrap">{site.state}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Badge status={site.status} />
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-gray-700">{site.expiryIn30Days}</td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
        <button className="text-blue-600 hover:text-blue-700 transition-colors" title="View on Map">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
        </button>
      </td>
      <td className="px-2 sm:px-3 py-2 sm:py-3 text-right sticky right-0 bg-white hover:bg-gray-50 z-[5] relative">
        <button className="px-2 sm:px-3 py-1.5 bg-white border border-gray-300 rounded text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1">
          Actions
          <ChevronDown className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
