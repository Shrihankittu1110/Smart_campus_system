const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Place order from cart
const placeOrder = async (req, res) => {
  try {
    const { studentId, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const cart = await Cart.findOne({ student: studentId }).populate('items.meal');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = cart.items.map(item => ({
      meal: item.meal._id,
      name: item.meal.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = new Order({
      student: studentId,
      canteen: cart.canteen,
      items: orderItems,
      totalAmount: cart.totalAmount,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
    });

    await order.save();

    // Create payment record
    const payment = new Payment({
      order: order._id,
      student: studentId,
      amount: cart.totalAmount,
      method: paymentMethod || 'cash',
      status: 'success',
      transactionId: 'TXN' + Date.now(),
    });
    await payment.save();

    // Update order payment status
    order.paymentStatus = 'paid';
    await order.save();

    // Clear cart after order
    await Cart.findOneAndDelete({ student: studentId });

    res.status(201).json({ success: true, data: order, payment });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel order (only if still pending)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['pending'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order details
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('canteen', 'name image')
      .populate('items.meal', 'name image');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { placeOrder, cancelOrder, getOrderById };