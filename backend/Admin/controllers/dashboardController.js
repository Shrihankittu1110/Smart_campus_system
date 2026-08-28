const ActivityLog = require('../models/ActivityLog');
const {
  buildOrderCanteenFilter,
  ensureApprovedCanteenDocuments,
} = require('../utils/canteenAdminData');

const getCollection = (name) => ActivityLog.db.db.collection(name);

// GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    await ensureApprovedCanteenDocuments();

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

    const canteens = await ensureApprovedCanteenDocuments();
    const data = await Promise.all(canteens.map(async (canteen) => {
      const totalOrders = await getCollection('orders').countDocuments({
        ...buildOrderCanteenFilter(canteen),
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' },
      });

      return {
        canteenName: canteen.canteenName || canteen.name || 'Unnamed Canteen',
        totalOrders,
      };
    }));

    data.sort((a, b) => b.totalOrders - a.totalOrders);
    res.json({ success: true, data });
  } catch (err) {
    console.error('getOrdersByCanteen error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/dashboard/activity
const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;

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

const logActivity = async ({ type, description, performedBy = {}, meta = {} }) => {
  try {
    await ActivityLog.create({ type, description, performedBy, meta });
  } catch (err) {
    console.error('ActivityLog write error:', err.message);
  }
};

module.exports = { getDashboardStats, getOrdersByCanteen, getActivityLogs, logActivity };
