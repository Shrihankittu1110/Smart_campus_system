//backend/Canteen/routes/revenueRoutes.js

const express = require('express');
const { getRevenue } = require('../controllers/revenueController');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('canteen'), getRevenue);

module.exports = router;