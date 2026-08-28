const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  createAdmin,
} = require('../controllers/Adminprofilecontroller');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/create-admin', createAdmin);

module.exports = router;
