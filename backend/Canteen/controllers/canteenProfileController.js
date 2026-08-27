//backend/Canteen/controllers/Canteenprofilecontroller.js
const mongoose = require('mongoose');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const getCollection = (name) => mongoose.connection.db.collection(name);


const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, WEBP allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/canteen/profile ──────────────────────────────────────────────────
const getCanteenProfile = async (req, res) => {
  try {
    const canteen = await getCollection('canteens').findOne({
      owner: new mongoose.Types.ObjectId(req.user._id),
    });
    if (!canteen) return res.status(404).json({ success: false, message: 'Canteen not found' });
    res.json({ success: true, data: canteen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/canteen/profile ──────────────────────────────────────────────────
const updateCanteenProfile = async (req, res) => {
  try {
    const { ownerName, canteenName, email, phone, location, description } = req.body;

    // ── Server-side validation ────────────────────────────────────────────────

    if (!ownerName || !canteenName) {
      return res.status(400).json({ success: false, message: 'Owner name and canteen name are required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(ownerName.trim())) {
      return res.status(400).json({ success: false, message: 'Owner name must contain letters only (no numbers or symbols)' });
    }

    if (ownerName.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Owner name must be 50 characters or less' });
    }

    if (!/^[a-zA-Z\s]+$/.test(canteenName.trim())) {
      return res.status(400).json({ success: false, message: 'Canteen name must contain letters only (no numbers or symbols)' });
    }

    if (canteenName.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Canteen name must be 50 characters or less' });
    }

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^@.\s]+\.[^@.\s]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address (e.g. name@example.com)' });
      }
    }

    if (description?.trim() && /\d/.test(description.trim())) {
      return res.status(400).json({ success: false, message: 'Description must not contain numbers' });
    }

    if (description?.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Description must be 500 characters or less' });
    }

    // ─────────────────────────────────────────────────────────────────────────

    const updateData = {
      ownerName:   ownerName.trim(),
      canteenName: canteenName.trim(),
      email:       email?.trim()       || '',
      phone:       phone?.trim()       || '',
      location:    location?.trim()    || '',
      description: description?.trim() || '',
      updatedAt:   new Date(),
    };

    if (req.file) {
  const base64 = req.file.buffer.toString('base64');
  updateData.image = `data:${req.file.mimetype};base64,${base64}`;
}

    const result = await getCollection('canteens').findOneAndUpdate(
      { owner: new mongoose.Types.ObjectId(req.user._id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ success: false, message: 'Canteen not found' });

    res.json({ success: true, message: 'Profile updated', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/canteen/hours ────────────────────────────────────────────────────
const getOperatingHours = async (req, res) => {
  try {
    const canteen = await getCollection('canteens').findOne(
      { owner: new mongoose.Types.ObjectId(req.user._id) },
      { projection: { operatingHours: 1 } }
    );

    let hours = canteen?.operatingHours || [];

    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
      } catch {
        hours = [];
      }
    }

    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/canteen/hours ────────────────────────────────────────────────────
const updateOperatingHours = async (req, res) => {
  try {
    const { hours } = req.body;

    if (!Array.isArray(hours) || hours.length === 0) {
      return res.status(400).json({ success: false, message: 'Hours array is required' });
    }

    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    for (const h of hours) {
      if (!validDays.includes(h.day)) {
        return res.status(400).json({ success: false, message: `Invalid day: ${h.day}` });
      }
    }

    await getCollection('canteens').updateOne(
      { owner: new mongoose.Types.ObjectId(req.user._id) },
      { $set: { operatingHours: hours, updatedAt: new Date() } }
    );

    res.json({ success: true, message: 'Operating hours updated', data: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, getCanteenProfile, updateCanteenProfile, getOperatingHours, updateOperatingHours };