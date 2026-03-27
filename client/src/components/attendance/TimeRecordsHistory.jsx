import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Image as ImageIcon, Clock, ChevronLeft, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
import { clockApi, schedulerApi, shiftApi } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';

// Get base URL for photo display (strip /api from VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function TimeRecordsHistory() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Fetched on mount from the employee record linked to logged-in user
  const [employeeId, setEmployeeId] = useState(null);

  // On mount: fetch employee record, then load sites + records
  useEffect(() => {
    const init = async () => {
      try {
        const res = await shiftApi.getMyEmployee();
        const id = res.data.data._id?.toString() || res.data.data.id;
        setEmployeeId(id);
        fetchSites();
        fetchRecords(id);
      } catch (err) {
        setError('Could not load your employee profile. Please contact your manager.');
        setLoading(false);
      }
    };
    init();
  }, [fetchSites, fetchRecords]);

  // Re-fetch when filters or page change (only after employeeId is known)
  useEffect(() => {
    if (employeeId) fetchRecords(employeeId);
  }, [employeeId, pagination.page, startDate, endDate, selectedSite, fetchRecords]);

  const fetchSites = useCallback(async () => {
    try {
      const response = await schedulerApi.getSites();
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  }, []);

  const fetchRecords = useCallback(async (empId) => {
    const resolvedId = empId || employeeId;
    if (!resolvedId) return;
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit };
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (selectedSite) params.siteId = selectedSite;
      const response = await clockApi.getMyHistory(resolvedId, params);
      setRecords(response.data.data || []);
      setPagination(response.data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load time records');
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, pagination.page, pagination.limit, startDate, endDate, selectedSite]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSite('');
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (hours) => {
    if (!hours) return 'N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[hsl(var(--color-foreground))]">My Time Records</h1>
          <p className="text-[hsl(var(--color-foreground-secondary))] mt-1">View your clock in/out history</p>
        </div>

        {/* Filters */}
        <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[hsl(var(--color-foreground-secondary))]" />
            <h2 className="text-lg font-semibold text-[hsl(var(--color-foreground))]">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="w-full px-3 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="w-full px-3 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--color-foreground))] mb-2">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => { setSelectedSite(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                className="w-full px-3 py-2 bg-[hsl(var(--color-surface-elevated))] border border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:border-transparent"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.siteLocationName}</option>
                ))}
              </select>
            </div>
          </div>

          {(startDate || endDate || selectedSite) && (
            <div className="mt-4">
              <button
                onClick={handleClearFilters}
                className="text-sm text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[hsl(var(--color-foreground))]">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--color-primary))]" />
          </div>
        )}

        {/* Table */}
        {!loading && records.length > 0 && (
          <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg overflow-hidden">
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
                        <span className="font-medium text-[hsl(var(--color-foreground))]">{formatDate(record.clockInTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[hsl(var(--color-foreground-secondary))]" />
                        <span className="text-[hsl(var(--color-foreground))]">{record.siteId?.siteLocationName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-[hsl(var(--color-foreground))]">{formatTime(record.clockInTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.clockOutTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          <span className="text-[hsl(var(--color-foreground))]">{formatTime(record.clockOutTime)}</span>
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--color-foreground-secondary))]">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-[hsl(var(--color-primary))]">{formatDuration(record.totalHours)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'CLOCKED_IN'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground-secondary))]'
                      }`}>
                        {record.status === 'CLOCKED_IN' ? 'Active' : 'Completed'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.clockInPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockInPhotoUrl)}
                            className="p-1 text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary-hover))] hover:bg-[hsl(var(--color-surface-elevated))] rounded"
                            title="View Clock In Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {record.clockOutPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockOutPhotoUrl)}
                            className="p-1 text-red-500 hover:text-red-400 hover:bg-[hsl(var(--color-surface-elevated))] rounded"
                            title="View Clock Out Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {!record.clockInPhotoUrl && !record.clockOutPhotoUrl && (
                          <span className="text-[hsl(var(--color-foreground-secondary))] text-sm">No photos</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="border-t border-[hsl(var(--color-border))] px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                Showing {records.length} of {pagination.total} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] rounded-lg hover:bg-[hsl(var(--color-card))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[hsl(var(--color-foreground-secondary))]">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] text-[hsl(var(--color-foreground))] rounded-lg hover:bg-[hsl(var(--color-card))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg p-12 text-center">
            <Clock className="w-16 h-16 text-[hsl(var(--color-foreground-secondary))] mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold text-[hsl(var(--color-foreground))] mb-2">No Time Records Found</h3>
            <p className="text-[hsl(var(--color-foreground-secondary))]">
              {startDate || endDate || selectedSite ? 'Try adjusting your filters' : "You haven't clocked in yet"}
            </p>
          </div>
        )}

        {/* Photo Viewer Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={`${API_BASE_URL}${selectedPhoto}`}
                alt="Clock Photo"
                className="max-w-full max-h-[90vh] rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 px-4 py-2 bg-[hsl(var(--color-card))] text-[hsl(var(--color-foreground))] rounded-lg font-medium hover:bg-[hsl(var(--color-surface-elevated))] transition-colors"
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
