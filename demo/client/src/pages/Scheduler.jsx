import { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  MapPin,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Upload,
  Printer,
  Search,
  Clock,
  Phone,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { schedulerApi, weatherApi, shiftApi } from "../lib/api";
import AddShiftModal from "../components/scheduler/AddShiftModal";

export default function Scheduler() {
  const [selectedSite, setSelectedSite] = useState("");
  const [viewMode, setViewMode] = useState("4weeks");
  const [viewType, setViewType] = useState("employee"); // employee, location, position
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef(null);

  // Current start date for the calendar view
  const [currentStartDate, setCurrentStartDate] = useState(
    new Date(2025, 11, 22),
  );

  // API state
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    employeeId: null,
    date: null,
  });

  // Hover state
  const [hoveredCell, setHoveredCell] = useState(null);

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await schedulerApi.getSites();
        setSites(response.data.data);
      } catch (err) {
        toast.error("Failed to load sites");
      }
    };
    fetchSites();
  }, []);

  // Fetch employees and shifts when site is selected
  useEffect(() => {
    if (!selectedSite) {
      setEmployees([]);
      setWeatherData([]);
      setShifts([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await schedulerApi.getSiteEmployees(selectedSite);
        const employeesData = response.data.data;

        // Transform employee data to match the UI format
        const transformedEmployees = employeesData.map((emp) => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          initials: `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase(),
          hours: "0.00",
          phone: emp.phone || "N/A",
          position: emp.position,
          firstName: emp.firstName,
          lastName: emp.lastName,
        }));

        setEmployees(transformedEmployees);

        // Fetch shifts for the current date range
        const numDays =
          viewMode === "week"
            ? 7
            : viewMode === "2weeks"
              ? 14
              : viewMode === "3weeks"
                ? 21
                : 28;
        const endDate = new Date(currentStartDate);
        endDate.setDate(endDate.getDate() + numDays - 1);

        const shiftsResponse = await schedulerApi.getSiteShifts(
          selectedSite,
          currentStartDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
        );
        setShifts(shiftsResponse.data.data);
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSite, currentStartDate, viewMode]);

  // Fetch weather when site is selected
  useEffect(() => {
    if (!selectedSite) {
      setWeatherData([]);
      return;
    }

    const fetchWeather = async () => {
      try {
        // Find the selected site to get coordinates
        const site = sites.find((s) => s.id === parseInt(selectedSite));
        if (!site || !site.latitude || !site.longitude) {
          return;
        }

        const response = await weatherApi.getForecast(
          site.latitude,
          site.longitude,
        );
        setWeatherData(response.data.data.forecast || []);
      } catch (err) {
        console.error("Failed to load weather data:", err);
        // Don't show error toast for weather - it's not critical
      }
    };

    fetchWeather();
  }, [selectedSite, sites]);

  // Close options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate date columns and range based on view mode
  const { dateColumns, dateRange } = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let numDays = 0;

    if (viewMode === "week") {
      numDays = 7;
    } else if (viewMode === "2weeks") {
      numDays = 14;
    } else if (viewMode === "3weeks") {
      numDays = 21;
    } else {
      // 4weeks
      numDays = 28;
    }

    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + numDays - 1);

    const startDay = currentStartDate.getDate();
    const startMonth = months[currentStartDate.getMonth()];
    const startYear = currentStartDate.getFullYear().toString().slice(2);
    const endDay = endDate.getDate();
    const endMonth = months[endDate.getMonth()];
    const endYear = endDate.getFullYear().toString().slice(2);

    const rangeText = `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;

    const columns = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < numDays; i++) {
      const date = new Date(currentStartDate);
      date.setDate(date.getDate() + i);
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];

      // Check if this is today
      const isToday = date.getTime() === today.getTime();

      if (isToday) {
        columns.push(`TODAY`);
      } else {
        columns.push(`${dayName} ${dayNum}, ${monthName}`);
      }
    }

    return { dateColumns: columns, dateRange: rangeText };
  }, [viewMode, currentStartDate]);

  // Navigation functions
  const handlePreviousPeriod = () => {
    const numDays =
      viewMode === "week"
        ? 7
        : viewMode === "2weeks"
          ? 14
          : viewMode === "3weeks"
            ? 21
            : 28;
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - numDays);
    setCurrentStartDate(newDate);
  };

  const handleNextPeriod = () => {
    const numDays =
      viewMode === "week"
        ? 7
        : viewMode === "2weeks"
          ? 14
          : viewMode === "3weeks"
            ? 21
            : 28;
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + numDays);
    setCurrentStartDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentStartDate(today);
  };

  // Handle opening add shift modal
  const handleAddShift = (employeeId, dateIndex) => {
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);

    setModalData({
      employeeId: employeeId,
      date: targetDate.toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  // Handle saving a shift
  const handleSaveShift = async (shiftData) => {
    try {
      const response = await shiftApi.create(shiftData);
      toast.success("Shift created successfully");
      setIsModalOpen(false);

      // Refresh shifts only if the created shift is for the currently selected site
      const createdShift = response.data.data;
      if (selectedSite && createdShift.siteId === selectedSite) {
        const numDays =
          viewMode === "week"
            ? 7
            : viewMode === "2weeks"
              ? 14
              : viewMode === "3weeks"
                ? 21
                : 28;
        const endDate = new Date(currentStartDate);
        endDate.setDate(endDate.getDate() + numDays - 1);

        const shiftsResponse = await schedulerApi.getSiteShifts(
          selectedSite,
          currentStartDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
        );
        setShifts(shiftsResponse.data.data);
      } else if (createdShift.siteId) {
        // If shift was created for a different site, switch to that site
        setSelectedSite(createdShift.siteId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create shift");
    }
  };

  // Get shifts for a specific employee and date
  const getShiftsForCell = (employeeId, dateIndex) => {
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date).toISOString().split("T")[0];
      // For open shifts (employeeId is null), only match if both are null
      if (employeeId === null) {
        return shiftDate === targetDateStr && shift.employeeId === null;
      }
      return shiftDate === targetDateStr && shift.employeeId === employeeId;
    });
  };

  // Format time from ISO string to HH:MM
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Calculate shift duration in hours
  const calculateShiftDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  const stats = [
    { label: "Coverage Hrs", value: "0.00", color: "bg-green-500" },
    { label: "Confirmed Hrs", value: "0.00", color: "bg-green-500" },
    { label: "Tentative Hrs", value: "0.00", color: "bg-red-500" },
    {
      label: "Published Shifts",
      value: shifts.filter((s) => s.status === "SCHEDULED").length.toString(),
      color: "bg-green-500",
    },
    { label: "Unpublished Shifts", value: "0", color: "bg-yellow-500" },
    {
      label: "Open Shifts",
      value: shifts.filter((s) => !s.employeeId).length.toString(),
      color: "bg-red-500",
    },
    { label: "Warnings", value: "0", color: "bg-orange-500" },
  ];

  // Get view mode label for select
  const getViewModeLabel = () => {
    if (viewMode === "week") return "Week";
    if (viewMode === "2weeks") return "2 Weeks";
    if (viewMode === "3weeks") return "3 Weeks";
    return "4 Weeks";
  };

  // Get weather icon based on weather condition
  const getWeatherIcon = (weather) => {
    if (!weather) return null;
    const condition = weather.toLowerCase();
    if (condition.includes("rain")) return <CloudRain className="h-4 w-4" />;
    if (condition.includes("cloud")) return <Cloud className="h-4 w-4" />;
    if (condition.includes("snow")) return <CloudSnow className="h-4 w-4" />;
    if (condition.includes("drizzle"))
      return <CloudDrizzle className="h-4 w-4" />;
    if (condition.includes("clear") || condition.includes("sun"))
      return <Sun className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  // Get weather for a specific date
  const getWeatherForDate = (dateIndex) => {
    if (!weatherData || weatherData.length === 0) return null;

    // Calculate the actual date for this column
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Find weather data for this date
    return weatherData.find((w) => w.date === targetDateStr);
  };

  return (
    <div className="flex flex-col h-screen bg-[hsl(220,15%,12%)]">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 py-3 border-b border-[hsl(220,15%,20%)] bg-[hsl(220,15%,14%)] gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-48 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
          >
            <option value="">Select Site...</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.shortName} - {site.siteLocationName}
              </option>
            ))}
          </Select>

          <Button
            variant={viewType === "employee" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("employee")}
            className={
              viewType === "employee"
                ? "bg-orange-600 hover:bg-orange-700 border-orange-600"
                : "bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            }
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "location" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("location")}
            className={
              viewType === "location"
                ? "bg-orange-600 hover:bg-orange-700 border-orange-600"
                : "bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            }
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "position" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("position")}
            className={
              viewType === "position"
                ? "bg-orange-600 hover:bg-orange-700 border-orange-600"
                : "bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            }
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPeriod}
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            onClick={handleToday}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 border border-[hsl(220,15%,22%)] bg-[hsl(220,15%,16%)] rounded-md min-w-[150px] sm:min-w-[200px] justify-center hover:bg-[hsl(220,15%,18%)] transition-colors text-gray-100"
          >
            <span className="text-xs sm:text-sm font-medium truncate">
              {dateRange}
            </span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPeriod}
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-32 bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-100"
          >
            <option value="week">Week</option>
            <option value="2weeks">2 Weeks</option>
            <option value="3weeks">3 Weeks</option>
            <option value="4weeks">4 Weeks</option>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
          >
            <Printer className="h-4 w-4" />
          </Button>

          <div className="relative" ref={optionsRef}>
            <Button
              variant="outline"
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="bg-[hsl(220,15%,18%)] border-[hsl(220,15%,22%)] text-gray-300 hover:bg-[hsl(220,15%,22%)]"
            >
              Options <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {/* Options Dropdown */}
            {optionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[hsl(220,15%,14%)] border border-[hsl(220,15%,20%)] rounded-xl shadow-2xl z-50">
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[hsl(220,15%,18%)] flex items-center gap-2 text-gray-200">
                    <Grid3x3 className="h-4 w-4 text-orange-500" />
                    Bulk Create OPEN Shifts
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[hsl(220,15%,18%)] flex items-center gap-2 text-gray-200">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Copy Roster to Attendance
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[hsl(220,15%,18%)] flex items-center gap-2 text-gray-200">
                    <Grid3x3 className="h-4 w-4 text-orange-500" />
                    Shift View
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[hsl(220,15%,18%)] flex items-center gap-2 text-gray-200">
                    <Grid3x3 className="h-4 w-4 text-orange-500" />
                    View Deleted Shifts
                  </button>

                  <div className="border-t border-[hsl(220,15%,20%)] my-1"></div>

                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer text-gray-200">
                      <span className="text-sm">Show Total Hours</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer text-gray-200">
                      <span className="text-sm">
                        Show Scheduled Employees Only
                      </span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer text-gray-200">
                      <span className="text-sm">Minimized View</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {shifts.filter((s) => s.status === "SCHEDULED").length > 0 ? (
            <Button
              variant="success"
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
            >
              Publish {shifts.filter((s) => s.status === "SCHEDULED").length}{" "}
              Shift
              {shifts.filter((s) => s.status === "SCHEDULED").length !== 1
                ? "s"
                : ""}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="bg-[hsl(220,15%,16%)] text-gray-400 border-[hsl(220,15%,22%)]"
            >
              No Shifts Published
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[120px] sm:w-[185px] border-r border-[hsl(220,15%,20%)] flex flex-col bg-[hsl(220,15%,14%)]">
          <div className="p-3 border-b border-[hsl(220,15%,20%)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-9 h-9 text-sm bg-[hsl(220,15%,16%)] border-[hsl(220,15%,22%)] text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Location View - Show only "TODAY" label */}
            {viewType === "location" && (
              <div className="p-3 border-b border-[hsl(220,15%,20%)]">
                <div className="text-sm font-medium text-gray-300">TODAY</div>
              </div>
            )}

            {/* Employee View - Show Open Shift and Employee List */}
            {viewType === "employee" && (
              <>
                {/* Open Shift */}
                <div className="p-3 border-b border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] flex items-center justify-center flex-shrink-0">
                      <Grid3x3 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-500 truncate">
                        Open Shift
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>0.00 Hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee List */}
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-3 border-b border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-[hsl(220,15%,20%)] text-gray-200">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-500 truncate hover:underline">
                          {employee.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{employee.hours} Hrs</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Position View - Show Open Shift and Employee List */}
            {viewType === "position" && (
              <>
                {/* Open Shift */}
                <div className="p-3 border-b border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded bg-[hsl(220,15%,16%)] border border-[hsl(220,15%,22%)] flex items-center justify-center flex-shrink-0">
                      <Grid3x3 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-500 truncate">
                        Open Shift
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>0.00 Hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee List */}
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-3 border-b border-[hsl(220,15%,20%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-[hsl(220,15%,20%)] text-gray-200">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-500 truncate hover:underline">
                          {employee.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{employee.hours} Hrs</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto bg-[hsl(220,15%,12%)]">
          <div className="min-w-max">
            {/* Date Headers */}
            <div className="flex border-b border-[hsl(220,15%,20%)] sticky top-0 bg-[hsl(220,15%,14%)] z-10">
              {dateColumns.map((date, index) => {
                const weather = getWeatherForDate(index);
                return (
                  <div
                    key={index}
                    className="w-[140px] px-2 py-3 text-center border-r border-[hsl(220,15%,20%)]"
                  >
                    {date === "TODAY" ? (
                      <div className="text-sm font-bold text-orange-500">
                        TODAY
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-medium text-gray-300">
                          {date.split(", ")[0]}
                        </div>
                        <div className="text-xs text-gray-500">
                          {date.split(", ")[1]}
                        </div>
                      </>
                    )}

                    {/* Weather Information */}
                    {weather && (
                      <div className="mt-1 flex items-center justify-center gap-1 text-gray-400">
                        {getWeatherIcon(weather.weather)}
                        <span className="text-xs font-medium">
                          {Math.round(weather.temp)}°C
                        </span>
                      </div>
                    )}

                    {/* Special day labels */}
                    {date.includes("25, Dec") && (
                      <div className="mt-1 px-2 py-0.5 bg-orange-600 text-white text-xs rounded">
                        Christmas Day
                      </div>
                    )}
                    {date.includes("26, Dec") && (
                      <div className="mt-1 px-2 py-0.5 bg-orange-600 text-white text-xs rounded">
                        Boxing Day
                      </div>
                    )}
                    {date.includes("1, Jan") && (
                      <div className="mt-1 px-2 py-0.5 bg-gray-700 text-white text-xs rounded">
                        New Year
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Location View - Only show Open Shift row */}
            {viewType === "location" && (
              <div className="flex border-b border-[hsl(220,15%,20%)] min-h-[90px]">
                {dateColumns.map((_, index) => {
                  const cellKey = `location-${index}`;
                  const isHovered = hoveredCell === cellKey;
                  return (
                    <div
                      key={index}
                      className="w-[140px] border-r border-[hsl(220,15%,20%)] bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer relative group"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isHovered && (
                        <button
                          onClick={() => handleAddShift(null, index)}
                          className="absolute inset-0 flex items-center justify-center bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                        >
                          + Add shift
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Employee/Position View - Show Open Shift + Employee Rows */}
            {(viewType === "employee" || viewType === "position") && (
              <>
                {/* Open Shift Row */}
                <div className="flex border-b border-[hsl(220,15%,20%)] min-h-[90px]">
                  {dateColumns.map((_, index) => {
                    const cellKey = `open-${index}`;
                    const isHovered = hoveredCell === cellKey;
                    const cellShifts = getShiftsForCell(null, index);

                    return (
                      <div
                        key={index}
                        className="w-[140px] border-r border-[hsl(220,15%,20%)] bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer relative p-1"
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {/* Display existing shifts */}
                        {cellShifts.length > 0 && (
                          <div className="space-y-1">
                            {cellShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="border border-[hsl(220,15%,22%)] rounded-lg overflow-hidden bg-[hsl(220,15%,16%)] text-xs shadow-sm"
                              >
                                <div className="px-2 py-1">
                                  <div className="font-medium text-gray-200">
                                    {formatTime(shift.startTime)} -{" "}
                                    {formatTime(shift.endTime)} (
                                    {calculateShiftDuration(
                                      shift.startTime,
                                      shift.endTime,
                                    )}{" "}
                                    Hrs)
                                  </div>
                                  <div className="text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    <span>
                                      {shift.site?.shortName || "Unknown Site"}
                                    </span>
                                  </div>
                                </div>
                                {shift.status === "SCHEDULED" && (
                                  <div className="bg-orange-600 text-white px-2 py-0.5 font-medium">
                                    Published
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show add shift button on hover if no shifts or space available */}
                        {isHovered && cellShifts.length === 0 && (
                          <button
                            onClick={() => handleAddShift(null, index)}
                            className="absolute inset-0 flex items-center justify-center bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                          >
                            + Add shift
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Employee Rows */}
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex border-b border-[hsl(220,15%,20%)] min-h-[90px]"
                  >
                    {dateColumns.map((_, index) => {
                      const cellKey = `${employee.id}-${index}`;
                      const isHovered = hoveredCell === cellKey;
                      const cellShifts = getShiftsForCell(employee.id, index);

                      return (
                        <div
                          key={index}
                          className="w-[140px] border-r border-[hsl(220,15%,20%)] bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,16%)] cursor-pointer relative p-1"
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {/* Display existing shifts */}
                          {cellShifts.length > 0 && (
                            <div className="space-y-1">
                              {cellShifts.map((shift) => (
                                <div
                                  key={shift.id}
                                  className="border border-[hsl(220,15%,22%)] rounded-lg overflow-hidden bg-[hsl(220,15%,16%)] text-xs shadow-sm"
                                >
                                  <div className="px-2 py-1">
                                    <div className="font-medium text-gray-200">
                                      {formatTime(shift.startTime)} -{" "}
                                      {formatTime(shift.endTime)} (
                                      {calculateShiftDuration(
                                        shift.startTime,
                                        shift.endTime,
                                      )}{" "}
                                      Hrs)
                                    </div>
                                    <div className="text-gray-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3" />
                                      <span>
                                        {shift.site?.shortName ||
                                          "Unknown Site"}
                                      </span>
                                    </div>
                                  </div>
                                  {shift.status === "SCHEDULED" && (
                                    <div className="bg-orange-600 text-white px-2 py-0.5 font-medium">
                                      Published
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Show add shift button on hover if no shifts or space available */}
                          {isHovered && cellShifts.length === 0 && (
                            <button
                              onClick={() => handleAddShift(employee.id, index)}
                              className="absolute inset-0 flex items-center justify-center bg-orange-500/10 text-orange-500 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                            >
                              + Add shift
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-[hsl(220,15%,20%)] bg-[hsl(220,15%,14%)] px-4 py-2">
        <div className="flex items-center gap-6 text-xs">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <span className="text-gray-300">
                {stat.value} {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Shift Modal */}
      <AddShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveShift}
        employees={employees}
        sites={sites}
        selectedSite={selectedSite}
        selectedDate={modalData.date}
        selectedEmployeeId={modalData.employeeId}
      />
    </div>
  );
}
