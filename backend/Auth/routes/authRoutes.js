const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    uploadDoc,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', uploadDoc.single('document'), register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;