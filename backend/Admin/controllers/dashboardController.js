const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');

const getCollection = (name) => mongoose.connection.db.collection(name);

// GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalApprovedCanteens] = await Promise.all([
      getCollection('users').countDocuments({ role: 'student' }),
        getCollection('orders').countDocuments({}),
       getCollection('canteens').countDocuments({ isApproved: true }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalApprovedCanteens, totalOrders },
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/dashboard/orders-by-canteen
const getOrdersByCanteen = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Step 1: Get today's orders grouped by canteen field (may be string or ObjectId)
    const grouped = await getCollection('orders').aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: { $toString: '$canteen' }, // normalize to string for grouping
          totalOrders: { $sum: 1 },
        },
      },
    ]).toArray();

    if (!grouped.length) return res.json({ success: true, data: [] });

    // Step 2: Fetch canteen names by matching string _id
    const canteenIds = grouped.map(g => {
      try { return new mongoose.Types.ObjectId(g._id); } catch { return null; }
    }).filter(Boolean);

    const canteens = await getCollection('canteens')
      .find({ _id: { $in: canteenIds } })
      .project({ canteenName: 1 }) 
      .toArray();


    // Step 3: Build a lookup map id→name
    const canteenMap = {};
    canteens.forEach(c => { canteenMap[c._id.toString()] = c.canteenName; });

    // Step 4: Merge
    const data = grouped.map(g => ({
      canteenName: canteenMap[g._id] || 'Unknown Canteen',
      totalOrders: g.totalOrders,
    })).sort((a, b) => b.totalOrders - a.totalOrders);

    res.json({ success: true, data });
  } catch (err) {
    console.error('getOrdersByCanteen error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/dashboard/activity
const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page  = parseInt(req.query.page)  || 1;

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(),
    ]);

    res.json({ success: true, data: logs, total, page, limit });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper — call from other controllers to record events
const logActivity = async ({ type, description, performedBy = {}, meta = {} }) => {
  try {
    await ActivityLog.create({ type, description, performedBy, meta });
  } catch (err) {
    console.error('ActivityLog write error:', err.message);
  }
};



module.exports = { getDashboardStats, getOrdersByCanteen, getActivityLogs, logActivity };
