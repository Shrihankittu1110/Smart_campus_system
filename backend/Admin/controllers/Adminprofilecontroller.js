const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Safe logActivity import — won't crash if path is wrong
let logActivity;
try {
  ({ logActivity } = require('./dashboardController'));
} catch (err) {
  console.warn('⚠️  Could not import logActivity:', err.message);
  logActivity = async () => {}; // no-op fallback so app doesn't crash
}

const UserModel = () => mongoose.model('User');

// ── GET /api/admin/profile ────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const admin = await UserModel().findById(req.user._id).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { name, phone, nic, profilePicture } = req.body;

    const updateData = {};
    if (name)           updateData.name           = name.trim();
    if (phone) {
      const cleanPhone = phone.trim();
      if (!/^[1-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be 10 digits and cannot start with 0',
        });
      }
      updateData.phone = cleanPhone;
    }
    if (nic)            updateData.nic            = nic.trim();
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updated = await UserModel().findByIdAndUpdate(
      adminId,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Admin not found' });

    try {
      await logActivity({
        type: 'USER_REGISTERED',
        description: `Admin profile updated: ${updated.name}`,
        performedBy: { userId: adminId, name: updated.name, role: 'Admin' },
      });
      console.log('✅ logActivity: profile updated logged');
    } catch (logErr) {
      console.error('❌ logActivity failed:', logErr.message);
    }

    res.json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/change-password ────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });

    const admin = await UserModel().findById(adminId).select('+password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    // ✅ Assign plain text and use save() so the pre('save') hook hashes it once
    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/create-admin ─────────────────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, nic, phone } = req.body;

    if (!name || !email || !password || !nic || !phone)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@gmail\.com$/i.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email must be a valid @gmail.com address',
      });
    }

    const cleanPhone = phone.trim();
    if (!/^[1-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits and cannot start with 0',
      });
    }

    const existing = await UserModel().findOne({ email: cleanEmail });
    if (existing)
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    // ✅ Pass plain text password — the pre('save') hook in User model hashes it once
    const newAdmin = await UserModel().create({
      name: name.trim(),
      email: cleanEmail,
      password,
      nic: nic.trim(),
      phone: cleanPhone,
      role: 'admin',
    });

    console.log('✅ New admin created:', newAdmin.name);

    try {
      await logActivity({
        type: 'USER_REGISTERED',
        description: `New admin added: ${newAdmin.name}`,
        performedBy: { userId: req.user._id, name: req.user.name, role: 'Admin' },
      });
      console.log('✅ logActivity: new admin logged');
    } catch (logErr) {
      console.error('❌ logActivity failed:', logErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (err) {
    console.error('createAdmin error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword, createAdmin };
