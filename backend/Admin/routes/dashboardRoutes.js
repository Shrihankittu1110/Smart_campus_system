const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const {
  getDashboardStats,
  getOrdersByCanteen,
  getActivityLogs,
  logActivity,
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats',              getDashboardStats);
router.get('/orders-by-canteen',  getOrdersByCanteen);
router.get('/activity',           getActivityLogs);

router.post('/activity', async (req, res) => {
  try {
    const { type, description } = req.body;
    await logActivity({
      type,
      description,
      performedBy: {
        userId: req.user?._id,
        name:   req.user?.name || 'Admin',
        role:   'Admin',
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
