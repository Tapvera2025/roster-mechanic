/**
 * Centralized Date Formatting Utilities for Backend
 *
 * Provides consistent date/time formatting for CSV exports and logging
 * Uses ISO formats for maximum compatibility with Excel and other tools
 */

/**
 * Format date to ISO format for CSV: YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateForCSV(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format time to 24-hour format for CSV: HH:MM:SS
 * @param {Date|string} date - Date/time to format
 * @returns {string} - Formatted time string
 */
function formatTimeForCSV(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format date-time to ISO 8601 format for CSV: YYYY-MM-DDTHH:MM:SS.sssZ
 * @param {Date|string} date - Date/time to format
 * @returns {string} - ISO formatted date-time string
 */
function formatDateTimeForCSV(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toISOString();
}

/**
 * Format duration in hours to readable format: X.XX hours
 * @param {number} hours - Duration in hours
 * @returns {string} - Formatted duration
 */
function formatDurationForCSV(hours) {
  if (!hours || hours === 0) return '0.00';
  if (typeof hours !== 'number' || isNaN(hours)) return '';

  return hours.toFixed(2);
}

/**
 * Format date for Australian display: DD/MM/YYYY
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateAU(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Parse date string safely
 * @param {string|Date} dateString - Date to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
function parseDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

module.exports = {
  formatDateForCSV,
  formatTimeForCSV,
  formatDateTimeForCSV,
  formatDurationForCSV,
  formatDateAU,
  parseDate,
};
