//backend/Canteen/models/Payment.js

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'ewallet'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  transactionId: { type: String, default: () => 'TXN' + Date.now() },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);