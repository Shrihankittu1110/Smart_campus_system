//backend/Canteen/controllers/dashboardController.js

const mongoose = require('mongoose');
const Meal     = require('../../models/Meal');
const getOwnedCanteen = require('../../utils/getOwnedCanteen');

const getOrders = () => mongoose.connection.db.collection('orders');
const mealCanteenFilter = (canteenId) => ({
  $or: [{ canteen: canteenId }, { canteen: canteenId.toString() }],
});

const getDashboard = async (req, res) => {
  try {
    const canteen = await getOwnedCanteen(req.user);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found for this user' });
    }

    const canteenObjId = canteen._id;

    // Today's date range
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);

    // ── Today's orders ────────────────────────────────────────────────────────
    const todayOrders = await getOrders().countDocuments({
      canteen: canteenObjId,           // ✅ FIXED: was canteenId
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // ── Pending orders ────────────────────────────────────────────────────────
    const pendingOrders = await getOrders().countDocuments({
      canteen: canteenObjId,           // ✅ FIXED: was canteenId
      status: 'pending',
    });

    // ── Total meals ───────────────────────────────────────────────────────────
    const totalMeals = await Meal.countDocuments(mealCanteenFilter(canteenObjId));

    // ── Today's revenue (completed orders today) ──────────────────────────────
    const todayRevenueResult = await getOrders().aggregate([
      {
        $match: {
          canteen: canteenObjId,       // ✅ FIXED: was canteenId
          status:    { $ne: 'cancelled' },
          paymentStatus: 'paid',
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]).toArray();
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // ── Order status breakdown (all time) ─────────────────────────────────────
    const orderStatusBreakdown = await getOrders().aggregate([
      { $match: { canteen: canteenObjId } },   // ✅ FIXED: was canteenId
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    // ── Popular meals (from completed orders) ─────────────────────────────────
    const completedOrders = await getOrders().find({
      canteen: canteenObjId,           // ✅ FIXED: was canteenId
      status:  { $ne: 'cancelled' },
      paymentStatus: 'paid',
    }).toArray();

    const mealMap = {};
    completedOrders.forEach(o => {
      o.items?.forEach(item => {
        if (!mealMap[item.name]) {
          mealMap[item.name] = { name: item.name, totalOrders: 0, totalRevenue: 0 };
        }
        mealMap[item.name].totalOrders  += item.quantity || 1;
        mealMap[item.name].totalRevenue += (item.price * (item.quantity || 1));
      });
    });
    const popularMeals = Object.values(mealMap)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        totalMeals,
        todayRevenue,
        orderStatusBreakdown,
        popularMeals,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
