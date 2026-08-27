const express = require('express');
const { getProfile, updateProfile, changePassword, createAdmin } = require('../controllers/Adminprofilecontroller');
// const { protect, adminOnly } = require('../../Middleware/authMiddleware'); // uncomment when auth ready

const router = express.Router();

// ── TEMP: fake req.user until Member 1's auth middleware is ready ─────────────
// DELETE this block once you uncomment protect + adminOnly above
router.use(async (req, res, next) => {
  try {
    if (!req.user) {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      const admin = await User.findOne({ role: 'admin' });
      req.user = admin;
    }
    next();
  } catch (err) {
    next(err);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

router.get('/profile',         getProfile);
router.put('/profile',         updateProfile);
router.put('/change-password', changePassword);
router.post('/create-admin',   createAdmin);

module.exports = router;