import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { userApi } from "../../lib/api";

export default function MyRoster() {
  const [viewMode, setViewMode] = useState("week");
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format a Date to YYYY-MM-DD using local time (avoids UTC timezone shift)
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Generate date columns based on view mode
  const { dateColumns, dateRange } = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let numDays = viewMode === "week" ? 7 : viewMode === "2weeks" ? 14 : viewMode === "3weeks" ? 21 : 28;

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
      const isToday = date.getTime() === today.getTime();

      columns.push({
        label: isToday ? "TODAY" : `${dayName} ${dayNum}, ${monthName}`,
        date: date,
        isToday,
        dayName,
        dayNum,
        monthName
      });
    }

    return { dateColumns: columns, dateRange: rangeText };
  }, [viewMode, currentStartDate]);

  // Fetch employee's shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const numDays = viewMode === "week" ? 7 : viewMode === "2weeks" ? 14 : viewMode === "3weeks" ? 21 : 28;
        const endDate = new Date(currentStartDate);
        endDate.setDate(endDate.getDate() + numDays - 1);

        const response = await userApi.getMyShifts(
          toLocalDateStr(currentStartDate),
          toLocalDateStr(endDate)
        );
        setShifts(response.data.data || []);
      } catch (err) {
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [currentStartDate, viewMode]);

  // Navigation functions
  const handlePreviousPeriod = () => {
    const numDays = viewMode === "week" ? 7 : viewMode === "2weeks" ? 14 : viewMode === "3weeks" ? 21 : 28;
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() - numDays);
    setCurrentStartDate(newDate);
  };

  const handleNextPeriod = () => {
    const numDays = viewMode === "week" ? 7 : viewMode === "2weeks" ? 14 : viewMode === "3weeks" ? 21 : 28;
    const newDate = new Date(currentStartDate);
    newDate.setDate(newDate.getDate() + numDays);
    setCurrentStartDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentStartDate(monday);
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date) => {
    const targetDateStr = toLocalDateStr(date);
    return shifts.filter(shift => {
      // shift.date is UTC midnight from server - compare using UTC date parts
      const sd = new Date(shift.date);
      const shiftDate = `${sd.getUTCFullYear()}-${String(sd.getUTCMonth() + 1).padStart(2, '0')}-${String(sd.getUTCDate()).padStart(2, '0')}`;
      return shiftDate === targetDateStr;
    });
  };

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate shift duration
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  // Calculate total hours
  const totalHours = shifts.reduce((acc, shift) => {
    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);
    return acc + (end - start) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--color-card))]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">My Rostered Shifts</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="icon" onClick={handlePreviousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            onClick={handleToday}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 border border-[hsl(var(--color-border))] rounded-md min-w-[150px] sm:min-w-[200px] justify-center hover:bg-[hsl(var(--color-surface-elevated))] transition-colors text-[hsl(var(--color-foreground))]"
          >
            <span className="text-xs sm:text-sm font-medium truncate">{dateRange}</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </button>

          <Button variant="outline" size="icon" onClick={handleNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-32"
          >
            <option value="week">Week</option>
            <option value="2weeks">2 Weeks</option>
            <option value="3weeks">3 Weeks</option>
            <option value="4weeks">4 Weeks</option>
          </Select>

          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Summary */}
        <div className="w-[120px] sm:w-[185px] border-r border-[hsl(var(--color-border))] flex flex-col bg-[hsl(var(--color-surface-elevated))]">
          <div className="p-3 border-b border-[hsl(var(--color-border))]">
            <div className="text-xs font-semibold tracking-widest uppercase text-[hsl(var(--color-foreground-muted))]">Summary</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 border-b border-[hsl(var(--color-border))] border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-card))] transition-colors">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">Total Hours</p>
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--color-foreground-secondary))]">
                    <span>{totalHours.toFixed(2)} Hrs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-[hsl(var(--color-border))] border-l-2 border-l-transparent hover:border-l-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-card))] transition-colors">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 rounded bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-primary-hover))] flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">Shifts</p>
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--color-foreground-secondary))]">
                    <span>{shifts.length} Scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[hsl(var(--color-foreground-secondary))]">Loading shifts...</div>
            </div>
          ) : (
            <div className="min-w-max">
              {/* Date Headers */}
              <div className="flex border-b border-[hsl(var(--color-border))] sticky top-0 bg-[hsl(var(--color-card))] z-10">
                {dateColumns.map((col, index) => (
                  <div
                    key={index}
                    className={`w-[120px] sm:w-[140px] px-2 py-3 text-center border-r border-[hsl(var(--color-border))] ${
                      col.isToday ? 'bg-[hsl(var(--color-primary))]/10' : ''
                    }`}
                  >
                    {col.isToday ? (
                      <div className="text-sm font-bold text-[hsl(var(--color-primary))]">TODAY</div>
                    ) : (
                      <>
                        <div className="text-xs font-medium text-[hsl(var(--color-foreground))]">
                          {col.dayName}
                        </div>
                        <div className="text-xs text-[hsl(var(--color-foreground-secondary))]">
                          {col.dayNum}, {col.monthName}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Shifts Row */}
              <div className="flex min-h-[400px]">
                {dateColumns.map((col, index) => {
                  const dayShifts = getShiftsForDate(col.date);
                  return (
                    <div
                      key={index}
                      className={`w-[120px] sm:w-[140px] border-r border-[hsl(var(--color-border))] p-1 ${
                        col.isToday ? 'bg-[hsl(var(--color-primary))]/5' : 'bg-[hsl(var(--color-card))]'
                      }`}
                    >
                      {dayShifts.length > 0 ? (
                        <div className="space-y-1">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="border border-[hsl(var(--color-border))] rounded overflow-hidden bg-[hsl(var(--color-surface-elevated))] text-xs"
                            >
                              <div className="px-2 py-1">
                                <div className="font-medium text-[hsl(var(--color-foreground))]">
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </div>
                                <div className="text-[hsl(var(--color-foreground-secondary))]">
                                  ({calculateDuration(shift.startTime, shift.endTime)} Hrs)
                                </div>
                                {shift.siteId && (
                                  <div className="text-[hsl(var(--color-foreground-secondary))] flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" style={{ color: "hsl(var(--color-primary))", opacity: 0.6 }} />
                                    <span className="truncate">{shift.siteId.shortName}</span>
                                  </div>
                                )}
                              </div>
                              <div className="bg-green-500 text-white px-2 py-0.5 font-medium text-center">
                                Confirmed
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[hsl(var(--color-border-strong))] text-xs">
                          -
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] px-4 py-2">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[hsl(var(--color-foreground-secondary))]">{shifts.length} Confirmed Shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--color-primary))]" />
            <span className="text-[hsl(var(--color-foreground-secondary))]">{totalHours.toFixed(2)} Total Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
