import { useState } from "react";
import {
  Users,
  Plus,
  Link2,
  ChevronDown,
  Settings,
  Maximize,
  RotateCw,
} from "lucide-react";
import EmployeeTable from "../components/employees/EmployeeTable";
import EmployeeFilters from "../components/employees/EmployeeFilters";

export default function EmployeePortal() {
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(220,15%,12%)]">
      {/* Employees Submenu Bar */}
      <div className="bg-[hsl(220,15%,14%)] border-b border-[hsl(220,15%,20%)] text-gray-100 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h1 className="text-base sm:text-lg font-semibold">Employees</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="p-1.5 sm:p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors text-gray-300 hover:text-gray-100"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className="p-1.5 sm:p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors text-gray-300 hover:text-gray-100"
              title="Expand"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              className="p-1.5 sm:p-2 hover:bg-[hsl(220,15%,18%)] rounded transition-colors text-gray-300 hover:text-gray-100"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-6">
        {/* Filter Section */}
        <div className="mb-4 sm:mb-6">
          <EmployeeFilters
            showInactive={showInactive}
            setShowInactive={setShowInactive}
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-lg hover:bg-[hsl(220,15%,18%)] transition-colors flex items-center gap-2 text-sm">
              <Link2 className="w-4 h-4" />
              <span className="hidden md:inline">Get App Link</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-lg hover:bg-[hsl(220,15%,18%)] transition-colors flex items-center gap-2 text-sm">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] text-gray-300 rounded-lg hover:bg-[hsl(220,15%,18%)] transition-colors flex items-center gap-2 text-sm">
              Columns
              <ChevronDown className="w-4 h-4" />
            </button>
            <select className="px-3 sm:px-4 py-2 bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] text-gray-100 rounded-lg text-sm cursor-pointer hover:bg-[hsl(220,15%,18%)] transition-colors">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <EmployeeTable showInactive={showInactive} />
      </div>
    </div>
  );
}
