import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Image as ImageIcon, Clock, ChevronLeft, ChevronRight, Filter, Loader2, Download, User, Navigation, Check, X, AlertCircle, Map } from 'lucide-react';
import { clockApi, schedulerApi, employeeApi } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useSocketEvent } from '../../contexts/SocketContext';
import { formatDistance, getDistanceColorClass } from '../../utils/distanceFormat';
import toast from 'react-hot-toast';
import LocationMapModal from './LocationMapModal';
import MobileCard from '../ui/MobileCard';

// Get base URL for photo display (strip /api from VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ManagerTimeRecords() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState(''); // New approval status filter
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Photo viewer
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Map viewer
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedRecordForMap, setSelectedRecordForMap] = useState(null);

  // Bulk selection
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');

  // Approval workflow
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRecordForAction, setSelectedRecordForAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchEmployees();
    fetchRecords();
  }, [pagination.page, startDate, endDate, selectedSite, selectedEmployee, approvalStatusFilter]);

  const fetchSites = async () => {
    try {
      const response = await schedulerApi.getSites();
      setSites(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeApi.getAll();
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchRecords = useCallback(async () => {
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
      if (selectedEmployee) params.employeeId = selectedEmployee;
      if (approvalStatusFilter) params.approvalStatus = approvalStatusFilter;

      const response = await clockApi.getRecords(params);

      setRecords(response.data.data || []);
      setPagination(response.data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load time records');
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, startDate, endDate, selectedSite, selectedEmployee, approvalStatusFilter]);

  // Real-time updates: Listen for clock-in/out events and refresh table
  useSocketEvent('clock-in', useCallback((data) => {
    console.log('Clock-in event received, refreshing records:', data);
    fetchRecords();
  }, [fetchRecords]));

  useSocketEvent('clock-out', useCallback((data) => {
    console.log('Clock-out event received, refreshing records:', data);
    fetchRecords();
  }, [fetchRecords]));

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const params = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (selectedSite) params.siteId = selectedSite;
      if (selectedEmployee) params.employeeId = selectedEmployee;

      const response = await clockApi.exportCSV(params);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-records-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export CSV');
      console.error('Failed to export CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSite('');
    setSelectedEmployee('');
    setApprovalStatusFilter('');
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

  const formatBreakTime = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const calculateWorkedHours = (totalHours, breakMinutes) => {
    if (!totalHours) return 0;
    const breakHours = (breakMinutes || 0) / 60;
    return Math.max(0, totalHours - breakHours);
  };

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingRecordIds = records
        .filter((r) => r.approvalStatus === 'PENDING')
        .map((r) => r._id);
      setSelectedRecords(pendingRecordIds);
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId) => {
    setSelectedRecords((prev) => {
      if (prev.includes(recordId)) {
        return prev.filter((id) => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  const handleBulkApprove = async () => {
    if (selectedRecords.length === 0) {
      toast.error('No records selected');
      return;
    }

    try {
      setActionLoading(true);
      const response = await clockApi.bulkApproveTimeRecords(selectedRecords);
      toast.success(`Bulk approval completed: ${response.data.data.approved} approved, ${response.data.data.failed} failed`);
      setSelectedRecords([]);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk approve');
      console.error('Failed to bulk approve:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRejectClick = () => {
    if (selectedRecords.length === 0) {
      toast.error('No records selected');
      return;
    }
    setBulkRejectModalOpen(true);
    setBulkRejectionReason('');
  };

  const handleBulkRejectSubmit = async () => {
    if (!bulkRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await clockApi.bulkRejectTimeRecords(selectedRecords, bulkRejectionReason);
      toast.success(`Bulk rejection completed: ${response.data.data.rejected} rejected, ${response.data.data.failed} failed`);
      setBulkRejectModalOpen(false);
      setBulkRejectionReason('');
      setSelectedRecords([]);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk reject');
      console.error('Failed to bulk reject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Approval handlers
  const handleApprove = async (recordId) => {
    try {
      setActionLoading(true);
      await clockApi.approveTimeRecord(recordId);
      toast.success('Time record approved successfully');
      fetchRecords(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve time record');
      console.error('Failed to approve:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (record) => {
    setSelectedRecordForAction(record);
    setRejectModalOpen(true);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await clockApi.rejectTimeRecord(selectedRecordForAction._id, rejectionReason);
      toast.success('Time record rejected successfully');
      setRejectModalOpen(false);
      setSelectedRecordForAction(null);
      setRejectionReason('');
      fetchRecords(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject time record');
      console.error('Failed to reject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getApprovalStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
      VOID: { label: 'Void', className: 'bg-gray-100 text-gray-800' },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  // Calculate summary statistics
  const totalHours = records.reduce((sum, record) => sum + (record.totalHours || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Time Records</h1>
            <p className="text-gray-600 mt-1">View and export all employee clock records</p>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting || records.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export CSV
              </>
            )}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours (Page)</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Approval Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Status
              </label>
              <select
                value={approvalStatusFilter}
                onChange={(e) => {
                  setApprovalStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(startDate || endDate || selectedSite || selectedEmployee || approvalStatusFilter) && (
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

        {/* Bulk Actions Bar */}
        {!loading && records.length > 0 && selectedRecords.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedRecords([])}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve Selected
              </button>
              <button
                onClick={handleBulkRejectClick}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject Selected
              </button>
            </div>
          </div>
        )}

        {/* Desktop/Tablet Table View */}
        {!loading && records.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden hidden sm:block table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={
                        records.filter((r) => r.approvalStatus === 'PENDING').length > 0 &&
                        selectedRecords.length === records.filter((r) => r.approvalStatus === 'PENDING').length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Site</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead className="hidden lg:table-cell">Break Time</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead className="hidden lg:table-cell">Photos</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id}>
                    {/* Checkbox */}
                    <TableCell>
                      {record.approvalStatus === 'PENDING' && (
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={() => handleSelectRecord(record._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      )}
                    </TableCell>

                    {/* Employee */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {record.employeeId?.firstName} {record.employeeId?.lastName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(record.clockInTime)}</span>
                      </div>
                    </TableCell>

                    {/* Site */}
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{record.siteId?.siteLocationName || 'N/A'}</span>
                      </div>
                    </TableCell>

                    {/* Location Distance */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          {record.clockInDistance !== null && record.clockInDistance !== undefined ? (
                            <div className="flex items-center gap-1" title="Clock in distance from site">
                              <Navigation className="w-3 h-3 text-green-500" />
                              <span className={`text-xs font-medium ${getDistanceColorClass(record.clockInDistance, record.siteId?.geoFenceRadius || 100)}`}>
                                {formatDistance(record.clockInDistance)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {record.clockOutDistance !== null && record.clockOutDistance !== undefined && (
                            <div className="flex items-center gap-1" title="Clock out distance from site">
                              <Navigation className="w-3 h-3 text-red-500" />
                              <span className={`text-xs font-medium ${getDistanceColorClass(record.clockOutDistance, record.siteId?.geoFenceRadius || 100)}`}>
                                {formatDistance(record.clockOutDistance)}
                              </span>
                            </div>
                          )}
                        </div>
                        {record.clockInLocation && (
                          <button
                            onClick={() => {
                              setSelectedRecordForMap(record);
                              setMapModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="View on map"
                          >
                            <Map className="w-4 h-4" />
                          </button>
                        )}
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
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-blue-600">
                          {formatDuration(record.totalHours)}
                        </span>
                        {record.totalBreakMinutes > 0 && (
                          <span className="text-xs text-gray-500" title="Worked hours (excluding breaks)">
                            Worked: {formatDuration(calculateWorkedHours(record.totalHours, record.totalBreakMinutes))}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Break Time */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm ${record.totalBreakMinutes > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                          {formatBreakTime(record.totalBreakMinutes)}
                        </span>
                        {record.breaks && record.breaks.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {record.breaks.length} break{record.breaks.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="hidden md:table-cell">
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

                    {/* Approval Status */}
                    <TableCell>
                      {getApprovalStatusBadge(record.approvalStatus || 'PENDING')}
                    </TableCell>

                    {/* Photos */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {record.clockInPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockInPhotoUrl)}
                            className="touch-target p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="View Clock In Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {record.clockOutPhotoUrl && (
                          <button
                            onClick={() => setSelectedPhoto(record.clockOutPhotoUrl)}
                            className="touch-target p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            title="View Clock Out Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {!record.clockInPhotoUrl && !record.clockOutPhotoUrl && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      {record.approvalStatus === 'PENDING' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(record._id)}
                            disabled={actionLoading}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectClick(record)}
                            disabled={actionLoading}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {record.approvalStatus !== 'PENDING' && (
                        <span className="text-xs text-gray-400">
                          {record.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
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

        {/* Mobile Card View */}
        {!loading && records.length > 0 && (
          <div className="sm:hidden space-y-3 p-3">
            {records.map((record) => (
              <MobileCard
                key={record._id}
                title={`${record.employeeId?.firstName} ${record.employeeId?.lastName}`}
                fields={[
                  { label: 'Date', value: formatDate(record.clockInTime) },
                  { label: 'Site', value: record.siteId?.siteLocationName || 'N/A' },
                  { label: 'Clock In', value: formatTime(record.clockInTime) },
                  { label: 'Clock Out', value: record.clockOutTime ? formatTime(record.clockOutTime) : 'Active' },
                  { label: 'Total Hours', value: formatDuration(record.totalHours) },
                  { label: 'Status', value: getApprovalStatusBadge(record.approvalStatus || 'PENDING') },
                ]}
                actions={
                  record.approvalStatus === 'PENDING'
                    ? [
                        {
                          label: 'Approve',
                          variant: 'success',
                          icon: Check,
                          onClick: () => handleApprove(record._id),
                        },
                        {
                          label: 'Reject',
                          variant: 'danger',
                          icon: X,
                          onClick: () => handleRejectClick(record),
                        },
                      ]
                    : []
                }
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && records.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Records Found</h3>
            <p className="text-gray-600">
              {startDate || endDate || selectedSite || selectedEmployee
                ? 'Try adjusting your filters'
                : 'No clock records available'}
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
                src={`${API_BASE_URL}${selectedPhoto}`}
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

        {/* Rejection Modal */}
        {rejectModalOpen && selectedRecordForAction && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (!actionLoading) {
                setRejectModalOpen(false);
                setSelectedRecordForAction(null);
                setRejectionReason('');
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Time Record</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                You are about to reject the time record for{' '}
                <span className="font-medium">
                  {selectedRecordForAction.employeeId?.firstName} {selectedRecordForAction.employeeId?.lastName}
                </span>{' '}
                on {formatDate(selectedRecordForAction.clockInTime)}.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  disabled={actionLoading}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Time Record'}
                </button>
                <button
                  onClick={() => {
                    if (!actionLoading) {
                      setRejectModalOpen(false);
                      setSelectedRecordForAction(null);
                      setRejectionReason('');
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Rejection Modal */}
        {bulkRejectModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (!actionLoading) {
                setBulkRejectModalOpen(false);
                setBulkRejectionReason('');
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk Reject Time Records</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                You are about to reject{' '}
                <span className="font-medium">{selectedRecords.length} time record{selectedRecords.length > 1 ? 's' : ''}</span>.
                All selected records will be rejected with the same reason.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={bulkRejectionReason}
                  onChange={(e) => setBulkRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  disabled={actionLoading}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkRejectSubmit}
                  disabled={actionLoading || !bulkRejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Rejecting...' : `Reject ${selectedRecords.length} Record${selectedRecords.length > 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => {
                    if (!actionLoading) {
                      setBulkRejectModalOpen(false);
                      setBulkRejectionReason('');
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Map Modal */}
        {mapModalOpen && selectedRecordForMap && (
          <LocationMapModal
            onClose={() => {
              setMapModalOpen(false);
              setSelectedRecordForMap(null);
            }}
            timeRecord={selectedRecordForMap}
          />
        )}
      </div>
    </div>
  );
}
