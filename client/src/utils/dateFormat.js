/**
 * Centralized Date Formatting Utilities
 *
 * Provides consistent date/time formatting across the application
 * Uses Australian date format (DD/MM/YYYY) for display
 */

/**
 * Format date to Australian format: DD/MM/YYYY
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date to long format: DD MMM YYYY (e.g., 15 Jan 2024)
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateLong(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const day = date.getDate();
  const month = date.toLocaleDateString('en-AU', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format time to 24-hour format: HH:MM
 * @param {string|Date} dateString - Date/time to format
 * @returns {string} - Formatted time string
 */
export function formatTime(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Time';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format time to 12-hour format with AM/PM: HH:MM AM/PM
 * @param {string|Date} dateString - Date/time to format
 * @returns {string} - Formatted time string
 */
export function formatTime12Hour(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Time';

  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date and time together: DD/MM/YYYY HH:MM
 * @param {string|Date} dateString - Date/time to format
 * @returns {string} - Formatted date-time string
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';

  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Format duration in hours to human-readable format: Xh Ym
 * @param {number} hours - Duration in hours (can be decimal)
 * @returns {string} - Formatted duration string
 */
export function formatDuration(hours) {
  if (!hours || hours === 0) return '0h 0m';
  if (typeof hours !== 'number' || isNaN(hours)) return 'N/A';

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  return `${h}h ${m}m`;
}

/**
 * Format date for CSV export (ISO format for Excel compatibility)
 * @param {string|Date} dateString - Date to format
 * @returns {string} - ISO formatted date string
 */
export function formatDateForCSV(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Return ISO format (YYYY-MM-DD) which Excel recognizes
  return date.toISOString().split('T')[0];
}

/**
 * Format time for CSV export
 * @param {string|Date} dateString - Date/time to format
 * @returns {string} - Formatted time string (HH:MM:SS)
 */
export function formatTimeForCSV(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format date-time for CSV export (ISO 8601 format)
 * @param {string|Date} dateString - Date/time to format
 * @returns {string} - ISO formatted date-time string
 */
export function formatDateTimeForCSV(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toISOString();
}

/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} dateString - Date to compare
 * @returns {string} - Relative time description
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;

  return formatDate(dateString);
}

/**
 * Parse date string to Date object safely
 * @param {string|Date} dateString - Date to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is today
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} - True if date is today
 */
export function isToday(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} - True if date is yesterday
 */
export function isYesterday(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}
