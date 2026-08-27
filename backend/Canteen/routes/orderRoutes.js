//backend/Canteen/routes/orderRoutes.js

const express = require('express');
const { getOrders, acceptOrder, rejectOrder, updateStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/',             protect, authorize('canteen'), getOrders);
router.patch('/:id/accept', protect, authorize('canteen'), acceptOrder);
router.patch('/:id/reject', protect, authorize('canteen'), rejectOrder);
router.patch('/:id/status', protect, authorize('canteen'), updateStatus);

module.exports = router;