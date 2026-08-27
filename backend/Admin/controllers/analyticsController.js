const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const getCollection = (name) => mongoose.connection.db.collection(name);

// ── GET /api/admin/analytics/canteens?month=3&year=2026 ───────────────────────
const getCanteenAnalytics = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 1);

    const canteens = await getCollection('canteens')
      .find({ isApproved: true })
      .toArray();

    const enriched = await Promise.all(canteens.map(async (c) => {
      const cid = new ObjectId(c._id);

      const canteenFilter = {
        $or: [
          { canteen: cid },
          { canteenId: c._id.toString() },
        ]
      };

      const monthlyOrders = await getCollection('orders').aggregate([
        { $match: { ...canteenFilter, createdAt: { $gte: startDate, $lt: endDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]).toArray();

      const totalOrders = await getCollection('orders').aggregate([
        { $match: { ...canteenFilter, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      ]).toArray();

      return {
        _id:            c._id,
        name:           c.name || c.canteenName,
        images:         c.images,
        monthlyOrders:  monthlyOrders[0]?.count   || 0,
        monthlyRevenue: monthlyOrders[0]?.revenue  || 0,
        totalOrders:    totalOrders[0]?.count      || 0,
        totalRevenue:   totalOrders[0]?.revenue    || 0,
      };
    }));

    enriched.sort((a, b) => {
  if (b.monthlyRevenue !== a.monthlyRevenue) return b.monthlyRevenue - a.monthlyRevenue;
  return b.totalRevenue - a.totalRevenue; // tiebreaker
});

const totalRevenue = enriched.reduce((s, c) => s + c.monthlyRevenue, 0);
const totalOrders  = enriched.reduce((s, c) => s + c.monthlyOrders,  0);

// pick topCanteen: if any monthly orders exist use monthly, else fall back to total
const hasMonthlyActivity = enriched.some(c => c.monthlyOrders > 0);
const topCanteen = hasMonthlyActivity
  ? enriched.reduce((best, c) => c.monthlyOrders > best.monthlyOrders ? c : best, enriched[0])?.name || '—'
  : enriched.reduce((best, c) => c.totalOrders  > best.totalOrders  ? c : best, enriched[0])?.name || '—';
    res.json({
      success: true,
      data: enriched,
      summary: { totalRevenue, totalOrders, topCanteen },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/analytics/monthly-trend?year=2026 ─────────────────────────
const getMonthlyTrend = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const canteens = await getCollection('canteens')
      .find({ isApproved: true }, { projection: { name: 1, canteenName: 1 } })
      .toArray();

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const data = await Promise.all(MONTHS.map(async (monthLabel, i) => {
      const startDate = new Date(year, i, 1);
      const endDate   = new Date(year, i + 1, 1);
      const row = { month: monthLabel };

      await Promise.all(canteens.map(async (c) => {
        const cid  = new ObjectId(c._id);
        const name = c.name || c.canteenName;

        const canteenFilter = {
          $or: [
            { canteen: cid },
            { canteenId: c._id.toString() },
          ]
        };

        const result = await getCollection('orders').aggregate([
          { $match: { ...canteenFilter, createdAt: { $gte: startDate, $lt: endDate }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ]).toArray();

        row[name] = result[0]?.count || 0;
      }));

      return row;
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCanteenAnalytics, getMonthlyTrend };