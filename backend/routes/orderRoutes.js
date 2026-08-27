const express = require('express');
const router = express.Router();
const {
  placeOrder,
  cancelOrder,
  getOrderById,
} = require('../controllers/orderController');

// POST /api/student/orders/place
router.post('/place', placeOrder);

// GET /api/student/orders/:orderId
router.get('/:orderId', getOrderById);

// PATCH /api/student/orders/:orderId/cancel
router.patch('/:orderId/cancel', cancelOrder);

module.exports = router;