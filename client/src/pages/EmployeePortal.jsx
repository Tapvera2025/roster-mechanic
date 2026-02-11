import { useState } from "react";
import { Users, Plus, Link2, ChevronDown, Settings, Maximize, RotateCw } from "lucide-react";
import EmployeeTable from "../components/employees/EmployeeTable";
import EmployeeFilters from "../components/employees/EmployeeFilters";

export default function EmployeePortal() {
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Employees Header */}
      <div className="bg-[hsl(var(--color-primary))] text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="text-base sm:text-lg font-semibold">Employees</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Expand">
              <Maximize className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-[hsl(var(--color-primary-dark))] rounded-lg transition-colors" title="Refresh">
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6">
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
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-md hover:bg-[hsl(var(--color-primary-dark))] transition-colors flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-2 text-sm">
              <Link2 className="w-4 h-4" />
              <span className="hidden md:inline">Get App Link</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-2 text-sm">
              Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex items-center gap-2 text-sm">
              Columns
              <ChevronDown className="w-4 h-4" />
            </button>
            <select className="px-3 sm:px-4 py-2 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md text-sm cursor-pointer hover:bg-[hsl(var(--color-surface-elevated))] transition-colors">
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
