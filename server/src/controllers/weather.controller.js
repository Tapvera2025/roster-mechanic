const weatherService = require('../services/weather.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get 5-day weather forecast for a location
 * @route GET /api/weather/forecast
 * @query {number} latitude - Location latitude
 * @query {number} longitude - Location longitude
 */
exports.getForecast = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;

  // Validate coordinates
  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid latitude or longitude'
    });
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90, longitude must be between -180 and 180'
    });
  }

  // Fetch weather data
  const weatherData = await weatherService.getFiveDayForecast(lat, lon);

  // Format the data
  const formattedData = weatherService.formatWeatherData(weatherData);

  res.json({
    success: true,
    data: {
      location: {
        latitude: lat,
        longitude: lon
      },
      forecast: formattedData,
      raw: weatherData
    }
  });
});
