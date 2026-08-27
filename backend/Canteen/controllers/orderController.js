//backend/Canteen/controllers/orderController.js

const mongoose   = require('mongoose');
const nodemailer = require('nodemailer');
const getOwnedCanteen = require('../../utils/getOwnedCanteen');

// ── Helper: get canteen _id from logged-in user ───────────────────────────────
const getCanteenId = async (user) => {
  const canteen = await getOwnedCanteen(user);
  return canteen?._id || null;
};

// ── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email not configured - set EMAIL_USER and EMAIL_PASS in .env');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `SmartMess Canteen <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.log('Email error:', err.message);
  }
};

const acceptedEmailHtml = (order) => `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#16a34a;padding:20px;text-align:center">
      <h2 style="color:white;margin:0">Order Accepted! 🎉</h2>
    </div>
    <div style="padding:24px">
      <p style="color:#374151">Hi <strong>${order.studentName}</strong>,</p>
      <p style="color:#374151">Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been <strong style="color:#16a34a">accepted</strong> and is being prepared.</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#15803d">Order Summary:</p>
        ${order.items?.map(i => `<p style="margin:4px 0;color:#374151">• ${i.name} x${i.quantity} — Rs.${i.price * i.quantity}</p>`).join('') || ''}
        <p style="margin:12px 0 0;font-weight:bold;color:#15803d">Total: Rs.${order.totalAmount}</p>
      </div>
      <p style="color:#6b7280;font-size:14px">You will be notified when your order is ready for pickup.</p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">SmartMess — Canteen Management System</p>
    </div>
  </div>
`;

const rejectedEmailHtml = (order) => `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#ef4444;padding:20px;text-align:center">
      <h2 style="color:white;margin:0">Order Rejected 😔</h2>
    </div>
    <div style="padding:24px">
      <p style="color:#374151">Hi <strong>${order.studentName}</strong>,</p>
      <p style="color:#374151">Unfortunately your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been <strong style="color:#ef4444">rejected</strong>.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#dc2626">Order Details:</p>
        ${order.items?.map(i => `<p style="margin:4px 0;color:#374151">• ${i.name} x${i.quantity}</p>`).join('') || ''}
        <p style="margin:12px 0 0;font-weight:bold;color:#dc2626">Total: Rs.${order.totalAmount}</p>
      </div>
      <p style="color:#6b7280;font-size:14px">Please try ordering again or contact the canteen.</p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">SmartMess — Canteen Management System</p>
    </div>
  </div>
`;

const getCollection = () => mongoose.connection.db.collection('orders');

// ── GET /api/canteen/orders ───────────────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const canteenId = await getCanteenId(req.user);
    if (!canteenId) return res.status(404).json({ success: false, message: 'Canteen not found' });

    const orders = await getCollection()
      .find({ canteen: canteenId })
      .sort({ createdAt: -1 })
      .toArray();

    // ── Populate student name and email from users collection ─────────────────
    const usersCollection = mongoose.connection.db.collection('users');

    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        if (!order.student) return { ...order, studentName: 'Unknown', studentEmail: '' };
        try {
          const student = await usersCollection.findOne(
            { _id: new mongoose.Types.ObjectId(order.student) },
            { projection: { name: 1, email: 1, phone: 1 } }
          );
          return {
            ...order,
            studentName:  student?.name  || 'Unknown',
            studentEmail: student?.email || '',
            studentPhone: student?.phone || '',
          };
        } catch {
          return { ...order, studentName: 'Unknown', studentEmail: '' };
        }
      })
    );

    res.json({ success: true, data: populatedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/canteen/orders/:id/accept ──────────────────────────────────────
const acceptOrder = async (req, res) => {
  try {
    const order = await getCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { status: 'accepted', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.studentEmail) {
      await sendEmail(order.studentEmail, `Order Accepted — #${order._id.toString().slice(-6).toUpperCase()}`, acceptedEmailHtml(order));
    }
    res.json({ success: true, message: 'Order accepted', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/canteen/orders/:id/reject ──────────────────────────────────────
const rejectOrder = async (req, res) => {
  try {
    const order = await getCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { status: 'cancelled', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.studentEmail) {
      await sendEmail(order.studentEmail, `Order Rejected — #${order._id.toString().slice(-6).toUpperCase()}`, rejectedEmailHtml(order));
    }
    res.json({ success: true, message: 'Order rejected', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/canteen/orders/:id/status ──────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await getCollection().findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Status updated', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrders, acceptOrder, rejectOrder, updateStatus };
