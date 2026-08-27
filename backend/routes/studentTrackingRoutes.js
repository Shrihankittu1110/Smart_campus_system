const express = require('express');
const router = express.Router();
const {
  getOrderHistory,
  trackOrderStatus,
  getMonthlyExpenses,
  submitRating,
  getMyRatings,
} = require('../controllers/studentTrackingController');

// GET /api/student/tracking/history/:studentId
router.get('/history/:studentId', getOrderHistory);

// GET /api/student/tracking/status/:orderId
router.get('/status/:orderId', trackOrderStatus);

// GET /api/student/tracking/expenses/:studentId
router.get('/expenses/:studentId', getMonthlyExpenses);

// POST /api/student/tracking/rating
router.post('/rating', submitRating);

// GET /api/student/tracking/ratings/:studentId
router.get('/ratings/:studentId', getMyRatings);

module.exports = router;