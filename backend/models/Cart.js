//backend/Canteen/models/Cart.js

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);