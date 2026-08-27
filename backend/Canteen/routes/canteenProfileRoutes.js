//backend/Canteen/routes/canteenProfileRoutes.js

const express = require('express');
const { upload, getCanteenProfile, updateCanteenProfile, getOperatingHours, updateOperatingHours } = require('../controllers/canteenProfileController.js');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, authorize('canteen'), getCanteenProfile);
router.put('/profile', protect, authorize('canteen'), upload.single('image'), updateCanteenProfile);
router.get('/hours',   protect, authorize('canteen'), getOperatingHours);
router.put('/hours',   protect, authorize('canteen'), updateOperatingHours);

module.exports = router;