const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMonthlyTrends,
  getWeeklyTrends,
} = require('../controllers/statsController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/stats/summary  — Admin, Analyst, Viewer
router.get('/summary', authenticate, getDashboardSummary);

// GET /api/stats/trends/monthly?months=12  — Admin, Analyst only
router.get('/trends/monthly', authenticate, authorize(['Admin', 'Analyst']), getMonthlyTrends);

// GET /api/stats/trends/weekly?weeks=8     — Admin, Analyst only
router.get('/trends/weekly', authenticate, authorize(['Admin', 'Analyst']), getWeeklyTrends);

module.exports = router;