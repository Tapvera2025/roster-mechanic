import { useState, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";
import complianceData from "../../data/complianceData";

export default function ComplianceFilters({ filters, setFilters }) {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    licenseType: true,
    state: true,
    deptWorkGroup: true,
    expiresWithin: true,
  });

  // Get unique employees from compliance data
  const uniqueEmployees = useMemo(() => {
    const empMap = new Map();
    complianceData.forEach((item) => {
      if (!empMap.has(item.empNo)) {
        empMap.set(item.empNo, {
          empNo: item.empNo,
          name: item.employeeName,
        });
      }
    });
    return Array.from(empMap.values());
  }, []);

  // Get unique values for dropdowns
  const uniqueStatuses = useMemo(
    () => ["All Status", ...new Set(complianceData.map((item) => item.status))],
    []
  );

  const uniqueLicenseTypes = useMemo(
    () => [
      "All License/Cert. Types",
      ...new Set(complianceData.map((item) => item.licenseCert)),
    ],
    []
  );

  const uniqueStates = useMemo(
    () => [
      "All States",
      ...new Set(complianceData.map((item) => item.state).filter(Boolean)),
    ],
    []
  );

  const uniqueDeptWorkGroups = useMemo(
    () => [
      "All Dept/Work Groups",
      ...new Set(complianceData.map((item) => item.deptWorkGroup).filter(Boolean)),
    ],
    []
  );

  const expiresOptions = [
    "Expires Within...",
    "7 days",
    "30 days",
    "60 days",
    "90 days",
    "6 months",
    "1 year",
  ];

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      licenseType: "all",
      state: "all",
      deptWorkGroup: "all",
      expiresWithin: "all",
      selectedEmployees: [],
    });
  };

  const handleSelectAllEmployees = () => {
    setFilters({
      ...filters,
      selectedEmployees: uniqueEmployees.map((emp) => emp.empNo),
    });
  };

  const handleUnselectAllEmployees = () => {
    setFilters({
      ...filters,
      selectedEmployees: [],
    });
  };

  const handleEmployeeToggle = (empNo) => {
    setFilters({
      ...filters,
      selectedEmployees: filters.selectedEmployees.includes(empNo)
        ? filters.selectedEmployees.filter((id) => id !== empNo)
        : [...filters.selectedEmployees, empNo],
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5">
      {/* Clear Filters Link */}
      <div className="mb-4 sm:mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[hsl(var(--color-foreground))] hidden lg:block">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mb-1.5 sm:mb-2">
          Status
        </label>
        <select
          value={filters.status === "all" ? "All Status" : filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value === "All Status" ? "all" : e.target.value,
            })
          }
          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded-lg bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent transition-all"
        >
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* License Type Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mb-1.5 sm:mb-2">
          License/Certification Type
        </label>
        <select
          value={
            filters.licenseType === "all"
              ? "All License/Cert. Types"
              : filters.licenseType
          }
          onChange={(e) =>
            setFilters({
              ...filters,
              licenseType:
                e.target.value === "All License/Cert. Types"
                  ? "all"
                  : e.target.value,
            })
          }
          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded-lg bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent transition-all"
        >
          {uniqueLicenseTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* State Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mb-1.5 sm:mb-2">
          State
        </label>
        <select
          value={filters.state === "all" ? "All States" : filters.state}
          onChange={(e) =>
            setFilters({
              ...filters,
              state: e.target.value === "All States" ? "all" : e.target.value,
            })
          }
          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded-lg bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent transition-all"
        >
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Dept/Work Group Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mb-1.5 sm:mb-2">
          Department/Work Group
        </label>
        <select
          value={
            filters.deptWorkGroup === "all"
              ? "All Dept/Work Groups"
              : filters.deptWorkGroup
          }
          onChange={(e) =>
            setFilters({
              ...filters,
              deptWorkGroup:
                e.target.value === "All Dept/Work Groups"
                  ? "all"
                  : e.target.value,
            })
          }
          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded-lg bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent transition-all"
        >
          {uniqueDeptWorkGroups.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Expires Within Filter */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-xs font-medium text-[hsl(var(--color-foreground-secondary))] mb-1.5 sm:mb-2">
          Expiration Period
        </label>
        <select
          value={
            filters.expiresWithin === "all"
              ? "Expires Within..."
              : filters.expiresWithin
          }
          onChange={(e) =>
            setFilters({
              ...filters,
              expiresWithin:
                e.target.value === "Expires Within..." ? "all" : e.target.value,
            })
          }
          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-[hsl(var(--color-border))] rounded-lg bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent transition-all"
        >
          {expiresOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Selection */}
      <div className="border-t border-[hsl(var(--color-border))] pt-3 sm:pt-4 mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-[hsl(var(--color-foreground))]">
            Employees {filters.selectedEmployees.length > 0 && `(${filters.selectedEmployees.length})`}
          </h3>
          <div className="flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            <button
              onClick={handleSelectAllEmployees}
              className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] transition-colors font-medium"
            >
              All
            </button>
            <span className="text-[hsl(var(--color-foreground-muted))]">|</span>
            <button
              onClick={handleUnselectAllEmployees}
              className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] transition-colors font-medium"
            >
              None
            </button>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto">
          {uniqueEmployees.map((emp) => (
            <label
              key={emp.empNo}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:bg-[hsl(var(--color-surface-elevated))] px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg transition-colors group"
            >
              <input
                type="checkbox"
                checked={filters.selectedEmployees.includes(emp.empNo)}
                onChange={() => handleEmployeeToggle(emp.empNo)}
                className="rounded border-[hsl(var(--color-border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))] focus:ring-offset-0 bg-[hsl(var(--color-surface-elevated))] w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-[hsl(var(--color-foreground-secondary))] group-hover:text-[hsl(var(--color-foreground))] transition-colors min-w-0">
                <span className="font-medium text-[hsl(var(--color-foreground))]">{emp.empNo}</span> - {emp.name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
