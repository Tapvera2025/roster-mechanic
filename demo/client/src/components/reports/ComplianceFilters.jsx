import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
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
    [],
  );

  const uniqueLicenseTypes = useMemo(
    () => [
      "All License/Cert. Types",
      ...new Set(complianceData.map((item) => item.licenseCert)),
    ],
    [],
  );

  const uniqueStates = useMemo(
    () => [
      "All States",
      ...new Set(complianceData.map((item) => item.state).filter(Boolean)),
    ],
    [],
  );

  const uniqueDeptWorkGroups = useMemo(
    () => [
      "All Dept/Work Groups",
      ...new Set(
        complianceData.map((item) => item.deptWorkGroup).filter(Boolean),
      ),
    ],
    [],
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
    <div className="p-4">
      {/* Clear Filters Link */}
      <div className="mb-4">
        <button
          onClick={handleClearFilters}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <select
          value={filters.status === "all" ? "All Status" : filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value === "All Status" ? "all" : e.target.value,
            })
          }
          className="w-full px-3 py-2 text-sm border border-[hsl(220,15%,22%)] rounded-lg bg-[hsl(220,15%,16%)] text-gray-100 hover:bg-[hsl(220,15%,18%)] transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* License Type Filter */}
      <div className="mb-4">
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
          className="w-full px-3 py-2 text-sm border border-[hsl(220,15%,22%)] rounded-lg bg-[hsl(220,15%,16%)] text-gray-100 hover:bg-[hsl(220,15%,18%)] transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {uniqueLicenseTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* State Filter */}
      <div className="mb-4">
        <select
          value={filters.state === "all" ? "All States" : filters.state}
          onChange={(e) =>
            setFilters({
              ...filters,
              state: e.target.value === "All States" ? "all" : e.target.value,
            })
          }
          className="w-full px-3 py-2 text-sm border border-[hsl(220,15%,22%)] rounded-lg bg-[hsl(220,15%,16%)] text-gray-100 hover:bg-[hsl(220,15%,18%)] transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Dept/Work Group Filter */}
      <div className="mb-4">
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
          className="w-full px-3 py-2 text-sm border border-[hsl(220,15%,22%)] rounded-lg bg-[hsl(220,15%,16%)] text-gray-100 hover:bg-[hsl(220,15%,18%)] transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {uniqueDeptWorkGroups.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Expires Within Filter */}
      <div className="mb-4">
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
          className="w-full px-3 py-2 text-sm border border-[hsl(220,15%,22%)] rounded-lg bg-[hsl(220,15%,16%)] text-gray-100 hover:bg-[hsl(220,15%,18%)] transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {expiresOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Selection */}
      <div className="border-t border-[hsl(220,15%,20%)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Employees</h3>
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSelectAllEmployees}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              Select All
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={handleUnselectAllEmployees}
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              Unselect All
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {uniqueEmployees.map((emp) => (
            <label
              key={emp.empNo}
              className="flex items-center gap-2 cursor-pointer hover:bg-[hsl(220,15%,16%)] p-1.5 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                checked={filters.selectedEmployees.includes(emp.empNo)}
                onChange={() => handleEmployeeToggle(emp.empNo)}
                className="w-4 h-4 rounded border-[hsl(220,15%,22%)] bg-[hsl(220,15%,18%)] text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-300">
                {emp.empNo} - {emp.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(220, 15%, 18%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(220, 15%, 30%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(220, 15%, 35%);
        }
      `}</style>
    </div>
  );
}
