import { useState, useEffect } from 'react';
import { Calendar, MapPin, Image as ImageIcon, Clock, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { clockApi, schedulerApi } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';

export default function TimeRecordsHistory() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);

  // Photo viewer
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const employeeId = localStorage.getItem('userId');

  useEffect(() => {
    fetchSites();
    fetchRecords();
  }, [pagination.page, startDate, endDate, selectedSite]);

  const fetchSites = async () => {
    try {
      const response = await schedulerApi.getSites();
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (selectedSite) params.siteId = selectedSite;

      const response = await clockApi.getMyHistory(employeeId, params);

      setRecords(response.data.data || []);
      setPagination(response.data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load time records');
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSite('');
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Time Records</h1>
          <p className="text-gray-600 mt-1">View your clock in/out history</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Site Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site
              </label>
              <select
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteLocationName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(startDate || endDate || selectedSite) && (
            <div className="mt-4">
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Table */}
        {!loading && records.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Photos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id}>
                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {formatDate(record.clockInTime)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Site */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{record.siteId?.siteLocationName || 'N/A'}</span>
                      </div>
                    </TableCell>

                    {/* Clock In */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span>{formatTime(record.clockInTime)}</span>
                      </div>
                    </TableCell>

                    {/* Clock Out */}
                    <TableCell>
                      {record.clockOutTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          <span>{formatTime(record.clockOutTime)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* Total Hours */}
                    <TableCell>
                      <span className="font-semibold text-blue-600">
                        {formatDuration(record.totalHours)}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'CLOCKED_IN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status === 'CLOCKED_IN' ? 'Active' : 'Completed'}
                      </span>
                    </TableCell>

                    {/* Photos */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.clockInPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockInPhotoUrl)}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="View Clock In Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {record.clockOutPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockOutPhotoUrl)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="View Clock Out Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {!record.clockInPhotoUrl && !record.clockOutPhotoUrl && (
                          <span className="text-gray-400 text-sm">No photos</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {records.length} of {pagination.total} records
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Records Found</h3>
            <p className="text-gray-600">
              {startDate || endDate || selectedSite
                ? 'Try adjusting your filters'
                : 'You haven\'t clocked in yet'}
            </p>
          </div>
        )}

        {/* Photo Viewer Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={`http://localhost:5000${selectedPhoto}`}
                alt="Clock Photo"
                className="max-w-full max-h-[90vh] rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
