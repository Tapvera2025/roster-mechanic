const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

// GET /api/weather/forecast - Get 5-day weather forecast
router.get('/forecast', weatherController.getForecast);

module.exports = router;
