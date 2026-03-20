/**
 * Geocoding Service
 *
 * Proxy service for geocoding/location search using Google Maps Geocoding API
 * Provides caching and proper error handling
 */

const axios = require('axios');
const NodeCache = require('node-cache');

// Cache geocoding results for 24 hours
const geocodeCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

class GeocodingService {
  constructor() {
    this.geocodeURL = 'https://maps.googleapis.com/maps/api/geocode/json';
    this.autocompleteURL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    this.placeDetailsURL = 'https://maps.googleapis.com/maps/api/place/details/json';
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!this.apiKey) {
      console.warn('WARNING: GOOGLE_MAPS_API_KEY not set in environment variables');
    }
  }

  /**
   * Helper function to map full state name to abbreviation for Australian states
   * @private
   */
  mapStateToCode(stateName) {
    if (!stateName) return '';

    const stateMap = {
      'New South Wales': 'NSW',
      'Victoria': 'VIC',
      'Queensland': 'QLD',
      'South Australia': 'SA',
      'Western Australia': 'WA',
      'Tasmania': 'TAS',
      'Northern Territory': 'NT',
      'Australian Capital Territory': 'ACT',
    };

    // Check if it's already a code
    if (Object.values(stateMap).includes(stateName.toUpperCase())) {
      return stateName.toUpperCase();
    }

    // Try to find by full name
    return stateMap[stateName] || stateName;
  }

  /**
   * Parse Google Maps address components into structured format
   * @private
   */
  parseAddressComponents(addressComponents) {
    let street = '';
    let suburb = '';
    let state = '';
    let postcode = '';
    let country = '';

    addressComponents.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        suburb = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = this.mapStateToCode(component.long_name);
      }
      if (types.includes('postal_code')) {
        postcode = component.long_name;
      }
      if (types.includes('country')) {
        country = component.short_name;
      }
    });

    return {
      road: street.trim(),
      street: street.trim(),
      suburb: suburb,
      town: suburb,
      city: suburb,
      state: state,
      postcode: postcode,
      country: country,
    };
  }

  /**
   * Search for locations using Places Autocomplete API
   * @param {Object} params - Search parameters
   * @param {String} params.query - Search query
   * @param {String} params.countryCode - Optional country code filter (e.g., 'au')
   * @param {Number} params.limit - Maximum number of results (default: 5)
   * @returns {Promise<Array>} - Array of location results
   */
  async search({ query, countryCode, limit = 5 }) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    if (!query || query.trim().length < 1) {
      return [];
    }

    // Create cache key
    const cacheKey = `search:${query}:${countryCode || 'all'}:${limit}`;
    const cached = geocodeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Step 1: Get autocomplete predictions
      const autocompleteParams = {
        input: query,
        key: this.apiKey,
        types: 'geocode', // Focus on addresses
      };

      if (countryCode) {
        autocompleteParams.components = `country:${countryCode.toLowerCase()}`;
      }

      const autocompleteResponse = await axios.get(this.autocompleteURL, {
        params: autocompleteParams,
        timeout: 10000,
      });

      if (autocompleteResponse.data.status !== 'OK') {
        if (autocompleteResponse.data.status === 'ZERO_RESULTS') {
          return [];
        }
        throw new Error(`Google Places API error: ${autocompleteResponse.data.status}`);
      }

      const predictions = autocompleteResponse.data.predictions.slice(0, limit);

      // Step 2: Get details for each prediction to get coordinates
      const detailsPromises = predictions.map(async (prediction) => {
        try {
          const detailsResponse = await axios.get(this.placeDetailsURL, {
            params: {
              place_id: prediction.place_id,
              fields: 'formatted_address,geometry,address_components',
              key: this.apiKey,
            },
            timeout: 10000,
          });

          if (detailsResponse.data.status === 'OK') {
            const place = detailsResponse.data.result;
            const address = this.parseAddressComponents(place.address_components);

            return {
              display_name: place.formatted_address,
              address: address,
              lat: place.geometry.location.lat.toString(),
              lon: place.geometry.location.lng.toString(),
              place_id: prediction.place_id,
              type: 'autocomplete',
              importance: 1,
            };
          }
          return null;
        } catch (err) {
          console.error(`Failed to get details for place_id ${prediction.place_id}:`, err.message);
          return null;
        }
      });

      const results = (await Promise.all(detailsPromises)).filter(Boolean);

      // Cache the results
      geocodeCache.set(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Autocomplete search error:', error.message);

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (error.message.includes('API key')) {
        throw new Error('Google Maps API configuration error');
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
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

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

    try {
      const response = await axios.get(this.geocodeURL, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status !== 'OK') {
        if (response.data.status === 'ZERO_RESULTS') {
          throw new Error('No address found for these coordinates');
        }
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const item = response.data.results[0];
      const address = this.parseAddressComponents(item.address_components);

      const result = {
        display_name: item.formatted_address,
        address: address,
        lat: item.geometry.location.lat.toString(),
        lon: item.geometry.location.lng.toString(),
        place_id: item.place_id,
      };

      // Cache the result
      geocodeCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (error.message.includes('API key')) {
        throw new Error('Google Maps API configuration error');
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
