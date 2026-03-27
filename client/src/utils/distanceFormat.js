/**
 * Distance Formatting Utilities
 *
 * Provides human-readable formatting for distances
 */

/**
 * Format distance in meters to human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} - Formatted distance string
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined) return 'N/A';
  if (typeof meters !== 'number' || isNaN(meters)) return 'N/A';

  // Show in meters if less than 1000m
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  // Show in kilometers with 2 decimal places
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Get color class based on distance from geofence
 * @param {number} distance - Distance in meters
 * @param {number} radius - Geofence radius in meters
 * @returns {string} - CSS color class
 */
export function getDistanceColorClass(distance, radius = 100) {
  if (distance === null || distance === undefined) return 'text-gray-400';

  const percentage = (distance / radius) * 100;

  if (percentage <= 50) return 'text-green-600'; // Very close
  if (percentage <= 80) return 'text-yellow-600'; // Close
  if (percentage <= 100) return 'text-orange-600'; // Near edge
  return 'text-red-600'; // Outside (shouldn't happen for successful clock-ins)
}

/**
 * Get distance status indicator
 * @param {number} distance - Distance in meters
 * @param {number} radius - Geofence radius in meters
 * @returns {object} - Status object with label and color
 */
export function getDistanceStatus(distance, radius = 100) {
  if (distance === null || distance === undefined) {
    return { label: 'Unknown', color: 'gray' };
  }

  const percentage = (distance / radius) * 100;

  if (percentage <= 25) {
    return { label: 'Excellent', color: 'green' };
  }
  if (percentage <= 50) {
    return { label: 'Good', color: 'green' };
  }
  if (percentage <= 75) {
    return { label: 'Fair', color: 'yellow' };
  }
  if (percentage <= 100) {
    return { label: 'At Edge', color: 'orange' };
  }

  return { label: 'Outside', color: 'red' };
}

/**
 * Format accuracy in meters
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} - Formatted accuracy string
 */
export function formatAccuracy(accuracy) {
  if (accuracy === null || accuracy === undefined) return 'N/A';
  if (typeof accuracy !== 'number' || isNaN(accuracy)) return 'N/A';

  return `±${Math.round(accuracy)}m`;
}
