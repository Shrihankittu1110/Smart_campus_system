const express = require('express');
const router = express.Router();
const {
  getPaymentByOrder,
  processMockPayment,
} = require('../controllers/paymentController');

// GET /api/student/payment/:orderId
router.get('/:orderId', getPaymentByOrder);

// POST /api/student/payment/process
router.post('/process', processMockPayment);

module.exports = router;