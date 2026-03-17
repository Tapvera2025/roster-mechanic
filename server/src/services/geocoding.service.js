/**
 * Geocoding Service
 *
 * Proxy service for geocoding/location search using OpenStreetMap Nominatim
 * Provides caching, rate limiting, and proper User-Agent headers
 */

const axios = require('axios');
const NodeCache = require('node-cache');

// Cache geocoding results for 24 hours
const geocodeCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

class GeocodingService {
  constructor() {
    this.baseURL = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'RosterMechanic/1.0 (https://rostermechanic.com.au)';
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests (Nominatim requirement)
  }

  /**
   * Rate limit requests to comply with Nominatim usage policy
   * @private
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for locations by query string
   * @param {Object} params - Search parameters
   * @param {String} params.query - Search query
   * @param {String} params.countryCode - Optional country code filter (e.g., 'au')
   * @param {Number} params.limit - Maximum number of results (default: 5)
   * @returns {Promise<Array>} - Array of location results
   */
  async search({ query, countryCode, limit = 5 }) {
    if (!query || query.trim().length < 3) {
      return [];
    }

    // Create cache key
    const cacheKey = `search:${query}:${countryCode || 'all'}:${limit}`;
    const cached = geocodeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Rate limit the request
    await this.rateLimit();

    try {
      const params = {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit,
      };

      if (countryCode) {
        params.countrycodes = countryCode.toLowerCase();
      }

      const response = await axios.get(`${this.baseURL}/search`, {
        params,
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en',
        },
        timeout: 10000,
      });

      const results = response.data.map((item) => ({
        display_name: item.display_name,
        address: item.address || {},
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
        type: item.type,
        importance: item.importance,
      }));

      // Cache the results
      geocodeCache.set(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Geocoding search error:', error.message);

      // Return empty array on error instead of throwing
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      throw new Error('Failed to fetch location suggestions. Please try again.');
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {Object} params - Geocode parameters
   * @param {Number} params.lat - Latitude
   * @param {Number} params.lon - Longitude
   * @returns {Promise<Object>} - Location details
   */
  async reverse({ lat, lon }) {
    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error('Invalid coordinates');
    }

    // Create cache key
    const cacheKey = `reverse:${latitude}:${longitude}`;
    const cached = geocodeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Rate limit the request
    await this.rateLimit();

    try {
      const response = await axios.get(`${this.baseURL}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en',
        },
        timeout: 10000,
      });

      const result = {
        display_name: response.data.display_name,
        address: response.data.address || {},
        lat: response.data.lat,
        lon: response.data.lon,
        place_id: response.data.place_id,
      };

      // Cache the result
      geocodeCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      throw new Error('Failed to reverse geocode coordinates. Please try again.');
    }
  }

  /**
   * Clear the geocoding cache
   */
  clearCache() {
    geocodeCache.flushAll();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    return geocodeCache.getStats();
  }
}

module.exports = new GeocodingService();
