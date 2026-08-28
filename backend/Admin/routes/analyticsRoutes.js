const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const { getCanteenAnalytics, getMonthlyTrend } = require('../controllers/analyticsController');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/analytics/canteens',      getCanteenAnalytics);
router.get('/analytics/monthly-trend', getMonthlyTrend);

module.exports = router;
