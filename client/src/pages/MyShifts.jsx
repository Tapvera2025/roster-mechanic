import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import toast from "react-hot-toast";
import { shiftApi } from "../lib/api";

export default function MyShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get user info from localStorage
  const userName = localStorage.getItem('userName') || 'Employee';

  // Calculate week range - starts from current date, shows next 7 days
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0); // Start from the given date
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Next 7 days
    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Calculate duration
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  // Fetch shifts
  const fetchMyShifts = async () => {
    try {
      setLoading(true);
      const response = await shiftApi.getMyShifts(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
      setShifts(response.data.data || []);
    } catch (err) {
      toast.error('Failed to load shifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyShifts();
  }, [currentDate]);

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group shifts by date
  const groupedShifts = shifts.reduce((acc, shift) => {
    const date = new Date(shift.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-1">My Shifts</h1>
        <p className="text-blue-100">Welcome back, {userName}!</p>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">Week of</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </p>
            </div>

            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={handleToday} variant="outline">
              Today
            </Button>
          </div>
        </div>

        {/* Shifts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Loading shifts...</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No shifts scheduled</p>
              <p className="text-gray-500 text-sm mt-1">
                You have no shifts for this week
              </p>
            </div>
          ) : (
            Object.entries(groupedShifts).map(([date, dateShifts]) => (
              <div key={date} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{date}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {dateShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`p-4 transition-colors ${
                        shift.isAdhoc
                          ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={`w-4 h-4 ${shift.isAdhoc ? 'text-orange-600' : 'text-blue-600'}`} />
                            <span className="font-semibold text-gray-900">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({calculateDuration(shift.startTime, shift.endTime)} hrs)
                            </span>
                            {shift.isAdhoc && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded">
                                ADHOC
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span>{shift.siteId?.siteLocationName || shift.siteId?.shortName || 'Unknown Site'}</span>
                          </div>

                          {shift.position && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{shift.position}</span>
                            </div>
                          )}

                          {shift.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              Note: {shift.notes}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            shift.status === 'SCHEDULED'
                              ? 'bg-green-100 text-green-800'
                              : shift.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : shift.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {shift.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {shifts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Week Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold text-gray-900">{shifts.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shifts.reduce((acc, shift) =>
                    acc + parseFloat(calculateDuration(shift.startTime, shift.endTime)), 0
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
