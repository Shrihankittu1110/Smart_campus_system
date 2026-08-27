// backend/Canteen/models/Meal.js

const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  price:   { type: Number,  default: 0     },
}, { _id: false });

const mealSchema = new mongoose.Schema({
  canteen:     { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
  name:        { type: String, required: true },
  description: { type: String },
  category:    {
    type: String,
    enum: ['Rice', 'Snacks', 'Desserts', 'Drinks', 'Breakfast', 'Other'],
    default: 'Other'
  },
  basePrice:   { type: Number, required: true },
  sizes: {
    Small:  { type: sizeSchema, default: () => ({}) },
    Medium: { type: sizeSchema, default: () => ({}) },
    Large:  { type: sizeSchema, default: () => ({}) },
  },
  // ← THIS WAS MISSING — Mongoose was silently dropping defaultSize on every save
  defaultSize: {
    type:    String,
    enum:    ['Small', 'Medium', 'Large'],
    default: 'Medium',
  },
  image:       { type: String },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Meal', mealSchema);