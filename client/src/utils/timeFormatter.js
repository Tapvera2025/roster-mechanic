/**
 * Time formatting utilities for 12-hour format display
 * Format: "09:30 AM" with leading zeros and uppercase AM/PM
 */

/**
 * Convert ISO datetime string to 12-hour format
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {string} - Formatted time like "09:30 AM"
 */
export function formatTime12Hour(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Convert to 12-hour format
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12; // Midnight and noon

  const period = hours < 12 ? 'AM' : 'PM';

  // Add leading zeros
  const hh = String(hour12).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return `${hh}:${mm} ${period}`;
}

/**
 * Extract 12-hour format hour from ISO string
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {string} - Hour in 12-hour format with leading zero (01-12)
 */
export function getHour12(isoString) {
  if (!isoString) return '06';

  const date = new Date(isoString);
  const hours = date.getHours();
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;

  return String(hour12).padStart(2, '0');
}

/**
 * Extract minute from ISO string
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {string} - Minute with leading zero (00-59)
 */
export function getMinute(isoString) {
  if (!isoString) return '00';

  const date = new Date(isoString);
  const minutes = date.getMinutes();

  return String(minutes).padStart(2, '0');
}

/**
 * Extract AM/PM period from ISO string
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {string} - "AM" or "PM"
 */
export function getTimePeriod(isoString) {
  if (!isoString) return 'AM';

  const date = new Date(isoString);
  const hours = date.getHours();

  return hours < 12 ? 'AM' : 'PM';
}

/**
 * Convert 12-hour time components to ISO datetime string
 * @param {string|number} hour - Hour in 12-hour format (1-12)
 * @param {string|number} minute - Minute (0-59)
 * @param {string} period - "AM" or "PM"
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {string} - ISO 8601 datetime string
 */
export function parseTime12Hour(hour, minute, period, date) {
  let hour24 = parseInt(hour);
  const min = parseInt(minute);

  // Convert to 24-hour format
  if (period === 'AM' && hour24 === 12) {
    hour24 = 0; // Midnight
  } else if (period === 'PM' && hour24 !== 12) {
    hour24 += 12; // Afternoon/evening
  }

  // Pad with zeros
  const hh = String(hour24).padStart(2, '0');
  const mm = String(min).padStart(2, '0');

  // Construct datetime string and convert to ISO
  const datetime = new Date(`${date}T${hh}:${mm}:00`);
  return datetime.toISOString();
}

/**
 * Validate time components
 * @param {string|number} hour - Hour (1-12)
 * @param {string|number} minute - Minute (0-59)
 * @param {string} period - "AM" or "PM"
 * @returns {boolean} - True if valid
 */
export function isValidTime(hour, minute, period) {
  const h = parseInt(hour);
  const m = parseInt(minute);

  if (isNaN(h) || isNaN(m)) return false;
  if (h < 1 || h > 12) return false;
  if (m < 0 || m > 59) return false;
  if (period !== 'AM' && period !== 'PM') return false;

  return true;
}
