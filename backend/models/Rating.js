//backend/models/Rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String },
  canteen:     { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  mealName:    { type: String },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String },
  tags:        [{ type: String }],
  reply:       { type: String },
  repliedAt:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);