const mongoose = require('mongoose');
const {
  buildOrderCanteenFilter,
  ensureApprovedCanteenDocuments,
  revenueSumExpression,
} = require('../utils/canteenAdminData');

const getCollection = (name) => mongoose.connection.db.collection(name);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const aggregateOrders = async (canteen, extraMatch = {}) => {
  const result = await getCollection('orders').aggregate([
    {
      $match: {
        ...buildOrderCanteenFilter(canteen),
        ...extraMatch,
        status: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: revenueSumExpression },
      },
    },
  ]).toArray();

  return {
    count: result[0]?.count || 0,
    revenue: result[0]?.revenue || 0,
  };
};

// GET /api/admin/analytics/canteens?month=3&year=2026
const getCanteenAnalytics = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const canteens = await ensureApprovedCanteenDocuments();

    const enriched = await Promise.all(canteens.map(async (canteen) => {
      const [monthlyOrders, totalOrders] = await Promise.all([
        aggregateOrders(canteen, { createdAt: { $gte: startDate, $lt: endDate } }),
        aggregateOrders(canteen),
      ]);

      return {
        _id: canteen._id,
        name: canteen.canteenName || canteen.name || 'Unnamed Canteen',
        images: canteen.images,
        image: canteen.image,
        monthlyOrders: monthlyOrders.count,
        monthlyRevenue: monthlyOrders.revenue,
        totalOrders: totalOrders.count,
        totalRevenue: totalOrders.revenue,
      };
    }));

    enriched.sort((a, b) => {
      if (b.monthlyRevenue !== a.monthlyRevenue) return b.monthlyRevenue - a.monthlyRevenue;
      return b.totalRevenue - a.totalRevenue;
    });

    const totalRevenue = enriched.reduce((sum, canteen) => sum + canteen.monthlyRevenue, 0);
    const totalOrders = enriched.reduce((sum, canteen) => sum + canteen.monthlyOrders, 0);
    const hasMonthlyActivity = enriched.some((canteen) => canteen.monthlyOrders > 0);
    const topCanteen = hasMonthlyActivity
      ? enriched.reduce((best, canteen) => canteen.monthlyOrders > best.monthlyOrders ? canteen : best, enriched[0])?.name || '-'
      : enriched.reduce((best, canteen) => canteen.totalOrders > best.totalOrders ? canteen : best, enriched[0])?.name || '-';

    res.json({
      success: true,
      data: enriched,
      summary: { totalRevenue, totalOrders, topCanteen },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/analytics/monthly-trend?year=2026
const getMonthlyTrend = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const canteens = await ensureApprovedCanteenDocuments();

    const data = await Promise.all(MONTHS.map(async (monthLabel, index) => {
      const startDate = new Date(year, index, 1);
      const endDate = new Date(year, index + 1, 1);
      const row = { month: monthLabel };

      await Promise.all(canteens.map(async (canteen) => {
        const name = canteen.canteenName || canteen.name || 'Unnamed Canteen';
        const result = await aggregateOrders(canteen, { createdAt: { $gte: startDate, $lt: endDate } });
        row[name] = result.count;
      }));

      return row;
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCanteenAnalytics, getMonthlyTrend };
