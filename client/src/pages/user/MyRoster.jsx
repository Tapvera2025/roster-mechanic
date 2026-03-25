import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Clock,
  MapPin,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react";
import { userApi, weatherApi } from "../../lib/api";

export default function MyRoster() {
  const [viewMode, setViewMode] = useState("week");
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState([]);

  // Format a Date to YYYY-MM-DD using local time
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const numDaysForMode = (mode) =>
    mode === "week" ? 7 : mode === "2weeks" ? 14 : mode === "3weeks" ? 21 : 28;

  // Generate date columns
  const { dateColumns, dateRange } = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const numDays = numDaysForMode(viewMode);

    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + numDays - 1);

    const rangeText = `${currentStartDate.getDate()} ${months[currentStartDate.getMonth()]} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const columns = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date(currentStartDate);
      date.setDate(date.getDate() + i);
      columns.push({
        label: days[date.getDay()],
        date,
        isToday: date.getTime() === today.getTime(),
        dayNum: date.getDate(),
        monthName: months[date.getMonth()],
      });
    }

    return { dateColumns: columns, dateRange: rangeText };
  }, [viewMode, currentStartDate]);

  // Fetch shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const numDays = numDaysForMode(viewMode);
        const endDate = new Date(currentStartDate);
        endDate.setDate(endDate.getDate() + numDays - 1);
        const response = await userApi.getMyShifts(
          toLocalDateStr(currentStartDate),
          toLocalDateStr(endDate)
        );
        setShifts(response.data.data || []);
      } catch {
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, [currentStartDate, viewMode]);

  // Fetch weather for each unique site in the loaded shifts
  useEffect(() => {
    if (shifts.length === 0) { setWeatherData([]); return; }

    const fetchWeather = async () => {
      // Collect unique sites that have coordinates
      const sitesMap = new Map();
      shifts.forEach((shift) => {
        const site = shift.siteId;
        if (site && site.id && site.latitude && site.longitude && !sitesMap.has(site.id)) {
          sitesMap.set(site.id, site);
        }
      });

      const results = await Promise.all(
        [...sitesMap.values()].map(async (site) => {
          try {
            const res = await weatherApi.getForecast(site.latitude, site.longitude);
            return { siteId: site.id, forecast: res.data.data.forecast || [] };
          } catch {
            return { siteId: site.id, forecast: [] };
          }
        })
      );
      setWeatherData(results);
    };

    fetchWeather();
  }, [shifts]);

  const handlePrev = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - numDaysForMode(viewMode));
    setCurrentStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + numDaysForMode(viewMode));
    setCurrentStartDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentStartDate(today);
  };

  const getShiftsForDate = (date) => {
    const target = toLocalDateStr(date);
    return shifts.filter((shift) => {
      const sd = new Date(shift.date);
      const shiftDate = `${sd.getUTCFullYear()}-${String(sd.getUTCMonth() + 1).padStart(2, "0")}-${String(sd.getUTCDate()).padStart(2, "0")}`;
      return shiftDate === target;
    });
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const calcDuration = (start, end) =>
    ((new Date(end) - new Date(start)) / (1000 * 60 * 60)).toFixed(1);

  // Get weather forecast entry for a given date and site
  // Weather service keys dates using UTC (toISOString), so we must match in UTC
  const getWeatherForDate = (date, siteId) => {
    if (!siteId || weatherData.length === 0) return null;
    const siteWeather = weatherData.find((w) => w.siteId === siteId);
    if (!siteWeather) return null;
    const dateStr = date.toISOString().split("T")[0];
    return siteWeather.forecast.find((w) => w.date === dateStr) || null;
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return <Cloud className="h-3 w-3" />;
    const c = condition.toLowerCase();
    if (c.includes("rain")) return <CloudRain className="h-3 w-3" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="h-3 w-3" />;
    if (c.includes("snow")) return <CloudSnow className="h-3 w-3" />;
    if (c.includes("clear") || c.includes("sun")) return <Sun className="h-3 w-3" />;
    return <Cloud className="h-3 w-3" />;
  };

  const totalHours = shifts.reduce(
    (acc, s) => acc + (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60 * 60),
    0
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-[hsl(var(--color-background))]">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] px-3 py-2">
        {/* Row 1: title + view selector */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[hsl(var(--color-primary))]" />
            <h1 className="text-sm font-semibold text-[hsl(var(--color-foreground))]">
              My Rostered Shifts
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-xs px-2 py-1.5 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-md focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-primary))]"
            >
              <option value="week">Week</option>
              <option value="2weeks">2 Weeks</option>
              <option value="3weeks">3 Weeks</option>
              <option value="4weeks">4 Weeks</option>
            </select>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 border border-[hsl(var(--color-border))] rounded-md text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 border border-[hsl(var(--color-border))] rounded-md text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[hsl(var(--color-border))] rounded-md hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
          >
            <span className="text-xs font-medium text-[hsl(var(--color-foreground))] truncate">
              {dateRange}
            </span>
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 border border-[hsl(var(--color-border))] rounded-md text-[hsl(var(--color-foreground-secondary))] hover:bg-[hsl(var(--color-surface-elevated))] transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Summary pills (mobile-friendly) ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))]">
        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-foreground-secondary))]">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span><span className="font-semibold text-[hsl(var(--color-foreground))]">{shifts.length}</span> shifts</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-foreground-secondary))]">
          <Clock className="w-3 h-3 text-[hsl(var(--color-primary))]" />
          <span><span className="font-semibold text-[hsl(var(--color-foreground))]">{totalHours.toFixed(1)}</span> hrs</span>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full py-16">
            <div className="flex flex-col items-center gap-2">
              <RotateCw className="w-6 h-6 animate-spin text-[hsl(var(--color-primary))]" />
              <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">Loading shifts…</span>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: `${dateColumns.length * 130}px` }}>
            {/* Date header row */}
            <thead className="sticky top-0 z-10 bg-[hsl(var(--color-card))]">
              <tr>
                {dateColumns.map((col, i) => (
                  <th
                    key={i}
                    className={`border-b border-r border-[hsl(var(--color-border))] px-2 py-2 text-center font-medium last:border-r-0 ${
                      col.isToday ? "bg-[hsl(var(--color-primary))]/10" : ""
                    }`}
                  >
                    {col.isToday ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--color-primary))]">Today</span>
                        <span className="text-base font-bold text-[hsl(var(--color-primary))]">{col.dayNum}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-[hsl(var(--color-foreground-secondary))]">{col.label}</span>
                        <span className="text-base font-semibold text-[hsl(var(--color-foreground))]">{col.dayNum}</span>
                        <span className="text-[10px] text-[hsl(var(--color-foreground-muted))]">{col.monthName}</span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Shift cells */}
            <tbody>
              <tr>
                {dateColumns.map((col, i) => {
                  const dayShifts = getShiftsForDate(col.date);
                  return (
                    <td
                      key={i}
                      className={`border-r border-b border-[hsl(var(--color-border))] align-top p-1.5 last:border-r-0 ${
                        col.isToday ? "bg-[hsl(var(--color-primary))]/5" : "bg-[hsl(var(--color-card))]"
                      }`}
                      style={{ minHeight: "120px", verticalAlign: "top" }}
                    >
                      {dayShifts.length > 0 ? (
                        <div className="space-y-1.5">
                          {dayShifts.map((shift) => {
                            const weather = getWeatherForDate(col.date, shift.siteId?.id);
                            return (
                              <div
                                key={shift.id}
                                className="rounded-md overflow-hidden border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] text-xs"
                              >
                                <div className="px-2 py-1.5 space-y-0.5">
                                  <div className="font-semibold text-[hsl(var(--color-foreground))] whitespace-nowrap">
                                    {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                  </div>
                                  <div className="text-[hsl(var(--color-foreground-secondary))]">
                                    {calcDuration(shift.startTime, shift.endTime)} hrs
                                  </div>
                                  {shift.siteId && (
                                    <div className="flex items-center gap-1 text-[hsl(var(--color-foreground-secondary))]">
                                      <MapPin className="h-2.5 w-2.5 text-[hsl(var(--color-primary))] flex-shrink-0" />
                                      <span className="truncate">{shift.siteId.shortName}</span>
                                    </div>
                                  )}
                                  {weather && (
                                    <div className="flex items-center gap-1 text-[hsl(var(--color-primary))] mt-0.5">
                                      {getWeatherIcon(weather.weather)}
                                      <span className="font-semibold">{Math.round(weather.temp)}°C</span>
                                      <span className="text-[hsl(var(--color-foreground-secondary))] capitalize truncate">{weather.description}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-green-500 text-white text-[10px] font-medium text-center py-0.5 tracking-wide">
                                  CONFIRMED
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-start justify-center pt-4 text-[hsl(var(--color-border-strong))] text-xs select-none">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
