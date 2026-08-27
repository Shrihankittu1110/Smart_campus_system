//backend/Canteen/models/Canteen.js

const mongoose = require('mongoose');

const operatingHourSchema = new mongoose.Schema({
  day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  isOpen:    { type: Boolean, default: true },
  openTime:  { type: String, default: '08:00' },
  closeTime: { type: String, default: '17:00' },
}, { _id: false });

const canteenSchema = new mongoose.Schema({
  // Owner reference
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerName:   { type: String },

  // Canteen info
  canteenName:        { type: String, required: true },
  name:        { type: String },
  email:       { type: String },
  phone:       { type: String },
  location:    { type: String },
  description: { type: String },
  image:       { type: String },
  registrationDocument: { type: String, default: '' },

  // Operating hours
  operatingHours: [operatingHourSchema],

  // Status
  isApproved: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Canteen', canteenSchema);