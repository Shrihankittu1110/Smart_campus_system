const mongoose = require('mongoose');
const Order = require('../models/Order');
const Rating = require('../models/Rating');

// Get order history for student
const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ student: req.params.studentId })
      .populate('canteen', 'name image')
      .populate('items.meal', 'name image')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track single order status
const trackOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('canteen', 'name image location');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: { status: order.status, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get monthly expenses
const getMonthlyExpenses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;
    const selectedYear = parseInt(year) || new Date().getFullYear();

    const expenses = await Order.aggregate([
      {
        $match: {
          student: mongoose.Types.ObjectId.createFromHexString(studentId),
          paymentStatus: 'paid',
          status: { $ne: 'cancelled' },
          createdAt: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lte: new Date(`${selectedYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const found = expenses.find(e => e._id === i + 1);
      return {
        month: i + 1,
        totalSpent: found ? found.totalSpent : 0,
        orderCount: found ? found.orderCount : 0,
      };
    });

    res.status(200).json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit rating & feedback
const submitRating = async (req, res) => {
  try {
    const { studentId, canteenId, orderId, rating, feedback, tags } = req.body;

    // Prevent duplicate ratings
    const existingRating = await Rating.findOne({ student: studentId, order: orderId });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You already rated this order' });
    }

    // Fetch student name
    const student = await mongoose.connection.db.collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(studentId) });

    // Fetch order to get meal names
    const order = await Order.findById(orderId).populate('items.meal', 'name');
    const mealName = order?.items?.map(i => i.meal?.name || i.name).filter(Boolean).join(', ') || '';

    const newRating = await Rating.create({
      student:     studentId,
      studentName: student?.name || 'Anonymous',
      canteen:     canteenId,
      order:       orderId,
      mealName,
      rating,
      comment:     feedback,   // 'feedback' from frontend → 'comment' in DB
      tags:        tags || [],
    });

    res.status(201).json({ success: true, data: newRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get ratings by student
const getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ student: req.params.studentId })
      .populate('canteen', 'name image')
      .populate('order')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOrderHistory, trackOrderStatus, getMonthlyExpenses, submitRating, getMyRatings };