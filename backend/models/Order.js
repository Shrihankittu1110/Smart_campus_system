//backend/Canteen/models/Order.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'ewallet'], default: 'cash' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);