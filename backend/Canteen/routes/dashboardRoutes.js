//backend/Canteen/routes/dashboardRoutes.js

const express          = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('canteen'), getDashboard);

module.exports = router;