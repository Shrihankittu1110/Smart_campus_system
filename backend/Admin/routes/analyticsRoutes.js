const express = require('express');
const { getCanteenAnalytics, getMonthlyTrend } = require('../controllers/analyticsController');
const router = express.Router();

router.get('/analytics/canteens',      getCanteenAnalytics);
router.get('/analytics/monthly-trend', getMonthlyTrend);

// Add this temporarily to your routes and hit: GET /api/admin/analytics/debug
router.get('/debug', async (req, res) => {
  const mongoose = require('mongoose');
  const db = mongoose.connection.db;

  // 1. Sample order
  const order = await db.collection('orders').findOne({});
  
  // 2. Sample canteen
  const canteen = await db.collection('canteens').findOne({ isApproved: true });

  // 3. Try matching orders with that canteen's id as string
  const matchByString = await db.collection('orders').countDocuments({ 
    canteenId: canteen._id.toString() 
  });

  // 4. Try matching with raw ObjectId
  const matchByObjectId = await db.collection('orders').countDocuments({ 
    canteenId: canteen._id 
  });

  // 5. Total orders in collection
  const totalOrders = await db.collection('orders').countDocuments({});

  res.json({
    sampleOrder: order,
    sampleCanteen: { _id: canteen._id, name: canteen.name },
    matchByString,
    matchByObjectId,
    totalOrders,
    canteenIdFromOrder: order?.canteenId,
    canteenIdType: typeof order?.canteenId,
  });
});

module.exports = router;