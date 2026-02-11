const https = require("https");

class WeatherService {
  /**
   * Fetch 5-day weather forecast for given coordinates
   * @param {number} latitude - Location latitude
   * @param {number} longitude - Location longitude
   * @returns {Promise<Object>} Weather forecast data
   */
  async getFiveDayForecast(latitude, longitude) {
    const apiKey =
      process.env.OPENWEATHER_API_KEY || "d6eddc3abec4593517ece346fbf32a33";

    return new Promise((resolve, reject) => {
      const options = {
        method: "GET",
        hostname: "api.openweathermap.org",
        port: null,
        path: `/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`,
        headers: {},
      };

      const req = https.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function () {
          try {
            const body = Buffer.concat(chunks);
            const data = JSON.parse(body.toString());
            resolve(data);
          } catch (error) {
            reject(new Error("Failed to parse weather data"));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Format weather data for frontend consumption
   * @param {Object} weatherData - Raw weather API response
   * @returns {Array} Formatted weather data by date
   */
  formatWeatherData(weatherData) {
    if (!weatherData || !weatherData.list) {
      return [];
    }

    // Group forecasts by date
    const forecastByDate = {};

    weatherData.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toISOString().split("T")[0];

      if (!forecastByDate[date]) {
        forecastByDate[date] = {
          date,
          temp: item.main.temp,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          feelsLike: item.main.feels_like,
          humidity: item.main.humidity,
          weather: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          windSpeed: item.wind.speed,
          clouds: item.clouds.all,
          forecasts: [],
        };
      }

      forecastByDate[date].forecasts.push({
        time: new Date(item.dt * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        temp: item.main.temp,
        weather: item.weather[0].main,
        icon: item.weather[0].icon,
      });
    });

    return Object.values(forecastByDate);
  }
}

module.exports = new WeatherService();
