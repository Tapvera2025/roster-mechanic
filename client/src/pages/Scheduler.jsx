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
  Zap,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Avatar, AvatarFallback } from "../components/ui/Avatar";
import { schedulerApi, weatherApi, shiftApi } from "../lib/api";
import AddShiftModal from "../components/scheduler/AddShiftModal";
import AddAdhocShiftModal from "../components/scheduler/AddAdhocShiftModal";
import ViewDeletedShiftsModal from "../components/scheduler/ViewDeletedShiftsModal";

export default function Scheduler() {
  const [selectedSite, setSelectedSite] = useState("");
  const [viewMode, setViewMode] = useState("week");
  const [viewType, setViewType] = useState("employee"); // employee, location, position
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shiftViewOpen, setShiftViewOpen] = useState(false);
  const [showDeletedShiftsModal, setShowDeletedShiftsModal] = useState(false);
  const optionsRef = useRef(null);

  // Current start date for the calendar view - starts from today
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  // API state
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    employeeId: null,
    date: null,
  });
  const [adhocModalData, setAdhocModalData] = useState({
    employeeId: null,
    date: null,
  });

  // Hover state
  const [hoveredCell, setHoveredCell] = useState(null);

  // Format a Date object to YYYY-MM-DD using local time (avoids UTC timezone shift)
  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

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
          hours: "0h 0m",
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
          toLocalDateStr(currentStartDate),
          toLocalDateStr(endDate),
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

  // Fetch weather for all sites in shifts
  useEffect(() => {
    if (shifts.length === 0 || sites.length === 0) {
      setWeatherData([]);
      return;
    }

    const fetchWeatherForAllSites = async () => {
      try {
        // Get unique site IDs from shifts
        const uniqueSiteIds = [
          ...new Set(
            shifts
              .map((shift) => {
                if (shift.siteId) {
                  return typeof shift.siteId === "object"
                    ? shift.siteId.id
                    : shift.siteId;
                }
                if (shift.site) {
                  return typeof shift.site === "object"
                    ? shift.site.id
                    : shift.site;
                }
                return null;
              })
              .filter(Boolean),
          ),
        ];

        // Fetch weather for each unique site
        const weatherPromises = uniqueSiteIds.map(async (siteId) => {
          const site = sites.find((s) => s.id === siteId);

          if (!site || !site.latitude || !site.longitude) {
            return { siteId, forecast: [] };
          }

          try {
            const response = await weatherApi.getForecast(
              site.latitude,
              site.longitude,
            );
            return {
              siteId,
              siteName: site.shortName || site.siteLocationName,
              forecast: response.data.data.forecast || [],
            };
          } catch (err) {
            console.error(`Failed to load weather for site ${siteId}:`, err);
            return { siteId, forecast: [] };
          }
        });

        const weatherResults = await Promise.all(weatherPromises);
        setWeatherData(weatherResults);
      } catch (err) {
        console.error("Failed to load weather data:", err);
        // Don't show error toast for weather - it's not critical
      }
    };

    fetchWeatherForAllSites();
  }, [shifts, sites]);

  // Close options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setOptionsOpen(false);
        setShiftViewOpen(false);
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
      date: toLocalDateStr(targetDate),
    });
    setIsModalOpen(true);
  };

  // Handle opening add adhoc shift modal
  const handleAddAdhocShift = (employeeId, dateIndex) => {
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);

    setAdhocModalData({
      employeeId: employeeId,
      date: toLocalDateStr(targetDate),
    });
    setIsAdhocModalOpen(true);
  };

  // Handle saving a shift
  const handleSaveShift = async (shiftData) => {
    try {
      const response = await shiftApi.create(shiftData);
      toast.success("Shift created successfully");
      setIsModalOpen(false);

      // Refresh shifts only if the created shift is for the currently selected site
      const createdShift = response.data.data;
      const createdShiftSiteId =
        typeof createdShift.siteId === "object"
          ? createdShift.siteId.id
          : createdShift.siteId;

      if (selectedSite && createdShiftSiteId === selectedSite) {
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
          toLocalDateStr(currentStartDate),
          toLocalDateStr(endDate),
        );
        setShifts(shiftsResponse.data.data);
      } else if (createdShiftSiteId) {
        // If shift was created for a different site, switch to that site
        setSelectedSite(createdShiftSiteId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create shift");
    }
  };

  // Handle saving an adhoc shift
  const handleSaveAdhocShift = async (shiftData) => {
    try {
      const response = await shiftApi.createAdhoc(shiftData);
      toast.success("Adhoc shift created successfully");
      setIsAdhocModalOpen(false);

      // Refresh shifts only if the created shift is for the currently selected site
      const createdShift = response.data.data;
      const createdShiftSiteId =
        typeof createdShift.siteId === "object"
          ? createdShift.siteId.id
          : createdShift.siteId;

      if (selectedSite && createdShiftSiteId === selectedSite) {
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
          toLocalDateStr(currentStartDate),
          toLocalDateStr(endDate),
        );
        setShifts(shiftsResponse.data.data);
      } else if (createdShiftSiteId) {
        // If shift was created for a different site, switch to that site
        setSelectedSite(createdShiftSiteId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create adhoc shift");
    }
  };

  // Get shifts for a specific employee and date
  const getShiftsForCell = (employeeId, dateIndex) => {
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);
    const targetDateStr = toLocalDateStr(targetDate);

    return shifts.filter((shift) => {
      // shift.date comes from the server as UTC midnight - parse and use UTC date parts
      const sd = new Date(shift.date);
      const shiftDate = `${sd.getUTCFullYear()}-${String(sd.getUTCMonth() + 1).padStart(2, '0')}-${String(sd.getUTCDate()).padStart(2, '0')}`;
      // Get the shift's employee ID (handle both object and string formats)
      const shiftEmployeeId = shift.employeeId
        ? typeof shift.employeeId === "object"
          ? shift.employeeId.id
          : shift.employeeId
        : null;

      // For open shifts (employeeId is null), only match if both are null
      if (employeeId === null) {
        return shiftDate === targetDateStr && shiftEmployeeId === null;
      }
      return shiftDate === targetDateStr && shiftEmployeeId === employeeId;
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

  // Calculate shift duration in hours and minutes
  const calculateShiftDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMinutes = (end - start) / (1000 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = [
    { label: "Coverage Hrs", value: "0h 0m", color: "bg-green-500" },
    { label: "Confirmed Hrs", value: "0h 0m", color: "bg-green-500" },
    { label: "Tentative Hrs", value: "0h 0m", color: "bg-red-500" },
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

  // Get weather for a specific date and site
  const getWeatherForDate = (dateIndex, siteId) => {
    if (!weatherData || weatherData.length === 0 || !siteId) {
      return null;
    }

    // Calculate the actual date for this column
    const targetDate = new Date(currentStartDate);
    targetDate.setDate(targetDate.getDate() + dateIndex);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Find weather data for this site
    const siteWeather = weatherData.find((w) => w.siteId === siteId);

    if (!siteWeather || !siteWeather.forecast) return null;

    // Find weather data for this date
    return siteWeather.forecast.find((w) => w.date === targetDateStr);
  };

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--color-card))]">
      {/* Top Toolbar - Mobile Responsive */}
      <div className="border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]">
        {/* Row 1: Site Selector & View Types (Always visible) */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full sm:w-48 text-sm"
            >
              <option value="">Select Site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.shortName} - {site.siteLocationName}
                </option>
              ))}
            </Select>

            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant={viewType === "employee" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewType("employee")}
                title="Employee View"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === "location" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewType("location")}
                title="Location View"
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === "position" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewType("position")}
                title="Position View"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add Shift Buttons - Visible on mobile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => {
                setModalData({ employeeId: null, date: new Date().toISOString().split("T")[0] });
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-sm px-2 sm:px-4"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Shift</span>
            </Button>

            <Button
              onClick={() => {
                setAdhocModalData({ employeeId: null, date: new Date().toISOString().split("T")[0] });
                setIsAdhocModalOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 text-sm px-2 sm:px-4"
              size="sm"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Adhoc</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Date Navigation & View Mode */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 gap-2 border-t border-[hsl(var(--color-border))]">
          {/* Date Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="outline" size="icon" onClick={handlePreviousPeriod} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              onClick={handleToday}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 border border-[hsl(var(--color-border))] rounded-md min-w-[120px] sm:min-w-[160px] justify-center hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
            >
              <span className="text-xs sm:text-sm font-medium text-[hsl(var(--color-foreground))] truncate">
                {dateRange}
              </span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[hsl(var(--color-foreground-secondary))]" />
            </button>

            <Button variant="outline" size="icon" onClick={handleNextPeriod} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-20 sm:w-28 text-xs sm:text-sm"
            >
              <option value="week">Week</option>
              <option value="2weeks">2 Weeks</option>
              <option value="3weeks">3 Weeks</option>
              <option value="4weeks">4 Weeks</option>
            </Select>

            {/* Desktop-only action buttons */}
            <div className="hidden lg:flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" title="Refresh">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" title="Upload">
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" title="Print">
                <Printer className="h-4 w-4" />
              </Button>
            </div>

            {/* Options dropdown */}
            <div className="relative" ref={optionsRef}>
            <Button
              variant="outline"
              onClick={() => setOptionsOpen(!optionsOpen)}
            >
              Options <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {/* Options Dropdown */}
            {optionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4 text-blue-600" />
                    Bulk Create OPEN Shifts
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Copy Roster to Attendance
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShiftViewOpen(!shiftViewOpen)}
                      className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center gap-2"
                    >
                      <Grid3x3 className="h-4 w-4 text-blue-600" />
                      Shift View
                      <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${shiftViewOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {shiftViewOpen && (
                      <div className="absolute right-full top-0 mr-1 w-48 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-md shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setViewType('employee');
                              setShiftViewOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center justify-between"
                          >
                            <span>Employee View</span>
                            {viewType === 'employee' && <span className="text-blue-600">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setViewType('location');
                              setShiftViewOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center justify-between"
                          >
                            <span>Location View</span>
                            {viewType === 'location' && <span className="text-blue-600">✓</span>}
                          </button>
                          <button
                            onClick={() => {
                              setViewType('position');
                              setShiftViewOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center justify-between"
                          >
                            <span>Position View</span>
                            {viewType === 'position' && <span className="text-blue-600">✓</span>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowDeletedShiftsModal(true);
                      setOptionsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-surface-elevated))] flex items-center gap-2"
                  >
                    <Grid3x3 className="h-4 w-4 text-blue-600" />
                    View Deleted Shifts
                  </button>

                  <div className="border-t border-[hsl(var(--color-border))] my-1"></div>

                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[hsl(var(--color-foreground))]">
                        Show Total Hours
                      </span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[hsl(var(--color-foreground))]">
                        Show Scheduled Employees Only
                      </span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                  <div className="px-4 py-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-[hsl(var(--color-foreground))]">
                        Minimized View
                      </span>
                      <input type="checkbox" className="toggle" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Publish button - hidden on small screens */}
            <div className="hidden md:block">
              {shifts.filter((s) => s.status === "SCHEDULED").length > 0 ? (
                <Button variant="success" size="sm">
                  Publish {shifts.filter((s) => s.status === "SCHEDULED").length}{" "}
                  Shift
                  {shifts.filter((s) => s.status === "SCHEDULED").length !== 1
                    ? "s"
                    : ""}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-[hsl(var(--color-surface-elevated))]"
                  size="sm"
                >
                  No Shifts
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - single scroll container, rows span full width */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-max">

          {/* Header Row: Search box + Date columns */}
          <div className="flex border-b border-[hsl(var(--color-border))] sticky top-0 z-20">
            {/* Sidebar header cell */}
            <div className="w-[120px] sm:w-[185px] flex-shrink-0 p-2 sm:p-3 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] flex items-center sticky left-0 z-30 border-b-0">
              <div className="relative w-full">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-[hsl(var(--color-primary))]" style={{opacity: 0.7}} />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-7 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm bg-[hsl(var(--color-background))] border-[hsl(var(--color-border-strong))] text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-foreground-muted))]"
                />
              </div>
            </div>
            {/* Date header cells */}
            {dateColumns.map((date, index) => {
              const weather = selectedSite
                ? getWeatherForDate(index, parseInt(selectedSite))
                : null;
              return (
                <div
                  key={index}
                  className="w-[100px] sm:w-[120px] lg:w-[140px] flex-shrink-0 px-1 sm:px-2 py-2 sm:py-3 text-center border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                >
                  {date === "TODAY" ? (
                    <div className="text-sm font-bold text-[hsl(var(--color-foreground))]">
                      TODAY
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-medium text-[hsl(var(--color-foreground))]">
                        {date.split(", ")[0]}
                      </div>
                      <div className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                        {date.split(", ")[1]}
                      </div>
                    </>
                  )}
                  {weather && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[hsl(var(--color-foreground-secondary))]">
                      {getWeatherIcon(weather.weather)}
                      <span className="text-xs font-medium">
                        {Math.round(weather.temp)}°C
                      </span>
                    </div>
                  )}
                  {date.includes("25, Dec") && (
                    <div className="mt-1 px-2 py-0.5 bg-blue-900 text-white text-xs rounded">
                      Christmas Day
                    </div>
                  )}
                  {date.includes("26, Dec") && (
                    <div className="mt-1 px-2 py-0.5 bg-blue-900 text-white text-xs rounded">
                      Boxing Day
                    </div>
                  )}
                  {date.includes("1, Jan") && (
                    <div className="mt-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded">
                      New Year
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Location View - grouped by sites */}
          {viewType === "location" && (
            <>
              {/* Group shifts by unique sites */}
              {(() => {
                // Get unique sites from shifts
                const uniqueSites = Array.from(
                  new Set(
                    shifts
                      .filter(shift => shift.siteId || shift.site)
                      .map(shift => {
                        const siteId = shift.siteId ?
                          (typeof shift.siteId === "object" ? shift.siteId._id || shift.siteId.id : shift.siteId) :
                          (shift.site ? (typeof shift.site === "object" ? shift.site._id || shift.site.id : shift.site) : null);
                        return siteId;
                      })
                      .filter(Boolean)
                  )
                ).map(siteId => {
                  const shift = shifts.find(s => {
                    const shiftSiteId = s.siteId ?
                      (typeof s.siteId === "object" ? s.siteId._id || s.siteId.id : s.siteId) :
                      (s.site ? (typeof s.site === "object" ? s.site._id || s.site.id : s.site) : null);
                    return shiftSiteId === siteId;
                  });
                  const siteData = shift?.siteId || shift?.site;
                  return {
                    id: siteId,
                    name: typeof siteData === "object" ? (siteData.siteLocationName || siteData.shortName || "Unknown Site") : "Unknown Site",
                    shortName: typeof siteData === "object" ? siteData.shortName : null
                  };
                });

                return uniqueSites.map(site => (
                  <div key={site.id} className="flex border-b border-[hsl(var(--color-border))] min-h-[90px]">
                    {/* Sidebar cell */}
                    <div className="w-[120px] sm:w-[185px] flex-shrink-0 p-2 sm:p-3 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-card))] cursor-pointer flex items-center sticky left-0 z-10 border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] transition-colors group">
                      <div className="flex items-start gap-1 sm:gap-2 w-full">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-blue-600 truncate group-hover:underline">
                            {site.name}
                          </p>
                          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-[hsl(var(--color-foreground-secondary))]">
                            <Clock className="h-2 w-2 sm:h-3 sm:w-3" style={{color: 'hsl(var(--color-primary))', opacity: 0.6}} />
                            <span>
                              {(() => {
                                const totalMins = shifts.filter(s => {
                                  const shiftSiteId = s.siteId ?
                                    (typeof s.siteId === "object" ? s.siteId._id || s.siteId.id : s.siteId) :
                                    (s.site ? (typeof s.site === "object" ? s.site._id || s.site.id : s.site) : null);
                                  return shiftSiteId === site.id;
                                }).map(s => {
                                  const start = new Date(s.startTime);
                                  const end = new Date(s.endTime);
                                  return (end - start) / (1000 * 60);
                                }).reduce((total, mins) => total + mins, 0);
                                const totalHours = Math.floor(totalMins / 60);
                                const totalMinutes = Math.round(totalMins % 60);
                                return `${totalHours}h ${totalMinutes}m`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Calendar cells */}
                    {dateColumns.map((_, index) => {
                      const cellKey = `location-${site.id}-${index}`;
                      const isHovered = hoveredCell === cellKey;
                      // Get shifts for this site and date
                      const cellShifts = shifts.filter(shift => {
                        const shiftSiteId = shift.siteId ?
                          (typeof shift.siteId === "object" ? shift.siteId._id || shift.siteId.id : shift.siteId) :
                          (shift.site ? (typeof shift.site === "object" ? shift.site._id || shift.site.id : shift.site) : null);
                        const shiftDate = new Date(shift.date);
                        const targetDate = dateRange[index];
                        return shiftSiteId === site.id &&
                               shiftDate.getDate() === targetDate.getDate() &&
                               shiftDate.getMonth() === targetDate.getMonth() &&
                               shiftDate.getFullYear() === targetDate.getFullYear();
                      });

                      return (
                        <div
                          key={index}
                          className="w-[100px] sm:w-[120px] lg:w-[140px] flex-shrink-0 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] cursor-pointer relative p-0.5 sm:p-1"
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {cellShifts.length > 0 && (
                            <div className="space-y-1">
                              {cellShifts.map((shift) => {
                                const weather = getWeatherForDate(index, site.id);
                                return (
                                  <div
                                    key={shift.id}
                                    className={`border rounded overflow-hidden text-xs ${
                                      shift.isAdhoc
                                        ? "border-orange-400 bg-orange-50"
                                        : "border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                                    }`}
                                  >
                                    <div className="px-1 sm:px-2 py-1">
                                      <div className="font-medium text-[hsl(var(--color-foreground))] text-[10px] sm:text-xs">
                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                        <span className="hidden sm:inline"> ({calculateShiftDuration(shift.startTime, shift.endTime)})</span>
                                      </div>
                                      <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-0.5 sm:gap-1 mt-0.5 text-[10px] sm:text-xs">
                                        <User className="h-2 w-2 sm:h-3 sm:w-3" />
                                        <span className="truncate">
                                          {shift.employeeId?.firstName || "Open"} {shift.employeeId?.lastName || ""}
                                        </span>
                                      </div>
                                      {weather && (
                                        <div className="hidden sm:flex items-center gap-1.5 mt-1 text-blue-600">
                                          {getWeatherIcon(weather.weather)}
                                          <span className="text-xs font-semibold">{Math.round(weather.temp)}°</span>
                                          <span className="text-xs capitalize">{weather.description}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {isHovered && cellShifts.length === 0 && (
                            <button
                              onClick={() => handleAddShift(null, index)}
                              className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                            >
                              + Add shift
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </>
          )}

          {/* Employee View */}
          {viewType === "employee" && (
            <>
              {/* Open Shift Row */}
              <div className="flex border-b border-[hsl(var(--color-border))] min-h-[90px]">
                {/* Sidebar cell */}
                <div className="w-[120px] sm:w-[185px] flex-shrink-0 p-2 sm:p-3 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-card))] cursor-pointer flex items-center sticky left-0 z-10 border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] transition-colors group">
                  <div className="flex items-start gap-1 sm:gap-2 w-full">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">
                        Open Shift
                      </p>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-[hsl(var(--color-foreground-secondary))]">
                        <Clock className="h-2 w-2 sm:h-3 sm:w-3" style={{color: 'hsl(var(--color-primary))', opacity: 0.6}} />
                        <span>0h 0m</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Calendar cells */}
                {dateColumns.map((_, index) => {
                  const cellKey = `open-${index}`;
                  const isHovered = hoveredCell === cellKey;
                  const cellShifts = getShiftsForCell(null, index);
                  return (
                    <div
                      key={index}
                      className="w-[100px] sm:w-[120px] lg:w-[140px] flex-shrink-0 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] cursor-pointer relative p-0.5 sm:p-1"
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cellShifts.length > 0 && (
                        <div className="space-y-1">
                          {cellShifts.map((shift) => {
                            const shiftSiteId = shift.siteId
                              ? typeof shift.siteId === "object"
                                ? shift.siteId.id
                                : shift.siteId
                              : shift.site
                                ? typeof shift.site === "object"
                                  ? shift.site.id
                                  : shift.site
                                : null;
                            const weather = getWeatherForDate(index, shiftSiteId);
                            return (
                              <div
                                key={shift.id}
                                className={`border rounded overflow-hidden text-xs ${
                                  shift.isAdhoc
                                    ? "border-orange-400 bg-orange-50"
                                    : "border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                                }`}
                              >
                                <div className="px-1 sm:px-2 py-1">
                                  <div className="font-medium text-[hsl(var(--color-foreground))] text-[10px] sm:text-xs">
                                    {formatTime(shift.startTime)} -{" "}
                                    {formatTime(shift.endTime)}
                                    <span className="hidden sm:inline"> ({calculateShiftDuration(shift.startTime, shift.endTime)} Hrs)</span>
                                  </div>
                                  <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-0.5 sm:gap-1 mt-0.5 text-[10px] sm:text-xs">
                                    <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
                                    <span className="truncate">
                                      {shift.siteId?.shortName || shift.site?.shortName || "Unknown Site"}
                                    </span>
                                  </div>
                                  {weather && (
                                    <div className="hidden sm:flex items-center gap-1.5 mt-1 text-blue-600">
                                      {getWeatherIcon(weather.weather)}
                                      <span className="text-xs font-semibold">{Math.round(weather.temp)}°</span>
                                      <span className="text-xs capitalize">{weather.description}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                                  {shift.isAdhoc && (
                                    <div className="bg-orange-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">ADHOC</div>
                                  )}
                                  {shift.status === "SCHEDULED" && (
                                    <div className="bg-green-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">Published</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isHovered && cellShifts.length === 0 && (
                        <button
                          onClick={() => handleAddShift(null, index)}
                          className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
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
                  className="flex border-b border-[hsl(var(--color-border))] min-h-[90px]"
                >
                  {/* Sidebar cell */}
                  <div className="w-[120px] sm:w-[185px] flex-shrink-0 p-2 sm:p-3 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-card))] cursor-pointer flex items-center sticky left-0 z-10 border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] transition-colors group">
                    <div className="flex items-start gap-1 sm:gap-2 w-full">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarFallback className="text-[10px] sm:text-xs font-bold text-white bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))]">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-blue-600 truncate group-hover:underline">
                          {employee.name}
                        </p>
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-[hsl(var(--color-foreground-secondary))]">
                          <Clock className="h-2 w-2 sm:h-3 sm:w-3" style={{color: 'hsl(var(--color-primary))', opacity: 0.6}} />
                          <span>{employee.hours}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-xs text-[hsl(var(--color-foreground-secondary))]">
                          <Phone className="h-3 w-3" style={{color: 'hsl(var(--color-primary))', opacity: 0.6}} />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Calendar cells */}
                  {dateColumns.map((_, index) => {
                    const cellKey = `${employee.id}-${index}`;
                    const isHovered = hoveredCell === cellKey;
                    const cellShifts = getShiftsForCell(employee.id, index);
                    return (
                      <div
                        key={index}
                        className="w-[100px] sm:w-[120px] lg:w-[140px] flex-shrink-0 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] cursor-pointer relative p-0.5 sm:p-1"
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {cellShifts.length > 0 && (
                          <div className="space-y-1">
                            {cellShifts.map((shift) => {
                              const shiftSiteId = shift.siteId
                                ? typeof shift.siteId === "object"
                                  ? shift.siteId.id
                                  : shift.siteId
                                : shift.site
                                  ? typeof shift.site === "object"
                                    ? shift.site.id
                                    : shift.site
                                  : null;
                              const weather = getWeatherForDate(index, shiftSiteId);
                              return (
                                <div
                                  key={shift.id}
                                  className={`border rounded overflow-hidden text-xs ${
                                    shift.isAdhoc
                                      ? "border-orange-400 bg-orange-50"
                                      : "border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                                  }`}
                                >
                                  <div className="px-1 sm:px-2 py-1">
                                    <div className="font-medium text-[hsl(var(--color-foreground))] text-[10px] sm:text-xs">
                                      {formatTime(shift.startTime)} -{" "}
                                      {formatTime(shift.endTime)}
                                      <span className="hidden sm:inline"> ({calculateShiftDuration(shift.startTime, shift.endTime)})</span>
                                    </div>
                                    <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-0.5 sm:gap-1 mt-0.5 text-[10px] sm:text-xs">
                                      <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
                                      <span className="truncate">
                                        {shift.siteId?.shortName || shift.site?.shortName || "Unknown Site"}
                                      </span>
                                    </div>
                                    {weather && (
                                      <div className="hidden sm:flex items-center gap-1.5 mt-1 text-blue-600">
                                        {getWeatherIcon(weather.weather)}
                                        <span className="text-xs font-semibold">{Math.round(weather.temp)}°</span>
                                        <span className="text-xs capitalize">{weather.description}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                                    {shift.isAdhoc && (
                                      <div className="bg-orange-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">ADHOC</div>
                                    )}
                                    {shift.status === "SCHEDULED" && (
                                      <div className="bg-green-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">Published</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isHovered && cellShifts.length === 0 && (
                          <button
                            onClick={() => handleAddShift(employee.id, index)}
                            className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
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

          {/* Position View - grouped by positions */}
          {viewType === "position" && (
            <>
              {/* Group shifts by unique positions */}
              {(() => {
                // Get unique positions from employees and shifts
                const uniquePositions = Array.from(
                  new Set([
                    ...employees.map(emp => emp.position).filter(Boolean),
                    ...shifts.map(shift => shift.position || shift.employeeId?.position).filter(Boolean)
                  ])
                );

                return uniquePositions.map(position => {
                  // Get employees with this position
                  const positionEmployees = employees.filter(emp => emp.position === position);

                  return (
                    <div key={position} className="border-b border-[hsl(var(--color-border))]">
                      {/* Position header row */}
                      <div className="flex min-h-[90px]">
                        {/* Sidebar cell */}
                        <div className="w-[120px] sm:w-[185px] flex-shrink-0 p-2 sm:p-3 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] hover:bg-[hsl(var(--color-card))] cursor-pointer flex items-center sticky left-0 z-10 border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] transition-colors group">
                          <div className="flex items-start gap-1 sm:gap-2 w-full">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-blue-600 truncate group-hover:underline">
                                {position}
                              </p>
                              <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-[hsl(var(--color-foreground-secondary))]">
                                <User className="h-2 w-2 sm:h-3 sm:w-3" style={{color: 'hsl(var(--color-primary))', opacity: 0.6}} />
                                <span>{positionEmployees.length} employee{positionEmployees.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Calendar cells */}
                        {dateColumns.map((_, index) => {
                          const cellKey = `position-${position}-${index}`;
                          const isHovered = hoveredCell === cellKey;
                          // Get all shifts for this position and date
                          const cellShifts = shifts.filter(shift => {
                            const shiftPosition = shift.position || shift.employeeId?.position;
                            const shiftDate = new Date(shift.date);
                            const targetDate = dateRange[index];
                            return shiftPosition === position &&
                                   shiftDate.getDate() === targetDate.getDate() &&
                                   shiftDate.getMonth() === targetDate.getMonth() &&
                                   shiftDate.getFullYear() === targetDate.getFullYear();
                          });

                          return (
                            <div
                              key={index}
                              className="w-[100px] sm:w-[120px] lg:w-[140px] flex-shrink-0 border-r border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] hover:bg-[hsl(var(--color-surface-elevated))] cursor-pointer relative p-0.5 sm:p-1"
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              {cellShifts.length > 0 && (
                                <div className="space-y-1">
                                  {cellShifts.map((shift) => {
                                    const shiftSiteId = shift.siteId ?
                                      (typeof shift.siteId === "object" ? shift.siteId._id || shift.siteId.id : shift.siteId) :
                                      (shift.site ? (typeof shift.site === "object" ? shift.site._id || shift.site.id : shift.site) : null);
                                    const weather = getWeatherForDate(index, shiftSiteId);
                                    return (
                                      <div
                                        key={shift.id}
                                        className={`border rounded overflow-hidden text-xs ${
                                          shift.isAdhoc
                                            ? "border-orange-400 bg-orange-50"
                                            : "border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))]"
                                        }`}
                                      >
                                        <div className="px-1 sm:px-2 py-1">
                                          <div className="font-medium text-[hsl(var(--color-foreground))] text-[10px] sm:text-xs">
                                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                            <span className="hidden sm:inline"> ({calculateShiftDuration(shift.startTime, shift.endTime)})</span>
                                          </div>
                                          <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-0.5 sm:gap-1 mt-0.5 text-[10px] sm:text-xs">
                                            <User className="h-2 w-2 sm:h-3 sm:w-3" />
                                            <span className="truncate">
                                              {shift.employeeId?.firstName || "Open"} {shift.employeeId?.lastName || ""}
                                            </span>
                                          </div>
                                          <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-0.5 sm:gap-1 mt-0.5 text-[10px] sm:text-xs">
                                            <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
                                            <span className="truncate">
                                              {shift.siteId?.shortName || shift.site?.shortName || "N/A"}
                                            </span>
                                          </div>
                                          {weather && (
                                            <div className="hidden sm:flex items-center gap-1.5 mt-1 text-blue-600">
                                              {getWeatherIcon(weather.weather)}
                                              <span className="text-xs font-semibold">{Math.round(weather.temp)}°</span>
                                              <span className="text-xs capitalize">{weather.description}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                                          {shift.isAdhoc && (
                                            <div className="bg-orange-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">ADHOC</div>
                                          )}
                                          {shift.status === "SCHEDULED" && (
                                            <div className="bg-green-500 text-white px-1 sm:px-2 py-0.5 font-medium text-[9px] sm:text-xs">Published</div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {isHovered && cellShifts.length === 0 && (
                                <button
                                  onClick={() => handleAddShift(null, index)}
                                  className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                  + Add shift
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}

        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] px-2 sm:px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 text-xs overflow-x-auto">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${stat.color}`} />
              <span className="text-[hsl(var(--color-foreground))] whitespace-nowrap text-xs">
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
        sites={sites}
        selectedSite={selectedSite}
        selectedDate={modalData.date}
        selectedEmployeeId={modalData.employeeId}
      />

      {/* Add Adhoc Shift Modal */}
      <AddAdhocShiftModal
        isOpen={isAdhocModalOpen}
        onClose={() => setIsAdhocModalOpen(false)}
        onSave={handleSaveAdhocShift}
        sites={sites}
        selectedSite={selectedSite}
        selectedDate={adhocModalData.date}
        selectedEmployeeId={adhocModalData.employeeId}
      />

      {/* View Deleted Shifts Modal */}
      {showDeletedShiftsModal && (
        <ViewDeletedShiftsModal
          onClose={() => setShowDeletedShiftsModal(false)}
          siteId={selectedSite}
        />
      )}
    </div>
  );
}
