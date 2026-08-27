const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const {
  getCanteenStats, getVisibilityStats,
  getCanteens, getApprovedCanteens,
  approveCanteen, rejectCanteen, toggleVisibility,  getPendingCanteens,
} = require('../controllers/Canteencontroller');

const router = express.Router();

// Temp auth middleware — remove when Member 1's auth is ready
router.use(protect);
router.use(authorize('admin'));

router.get('/canteens/stats',           getCanteenStats);
router.get('/canteens/visibility-stats', getVisibilityStats);
router.get('/canteens/approved-list',   getApprovedCanteens);
router.get('/canteens',                 getCanteens);
router.put('/canteens/:id/approve',     approveCanteen);
router.put('/canteens/:id/reject',      rejectCanteen);
router.put('/canteens/:id/visibility',  toggleVisibility);
router.get('/canteens/pending', getPendingCanteens);

module.exports = router;