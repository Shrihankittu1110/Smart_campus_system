const express = require('express');
const {
  getStatus,
  createToken,
  getMyToken,
  getStaffQueue,
  completeToken,
} = require('../controllers/queueController');
const { protect, authorize } = require('../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/status', protect, getStatus);
router.get('/my-token', protect, authorize('student'), getMyToken);
router.post('/tokens', protect, authorize('student'), createToken);
router.get('/staff', protect, authorize('canteen'), getStaffQueue);
router.patch('/staff/tokens/:id/complete', protect, authorize('canteen'), completeToken);

module.exports = router;
