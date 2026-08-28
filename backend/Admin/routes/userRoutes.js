const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const { getUserStats, getUsers, blockUser, unblockUser, createAdmin } = require('../controllers/userController');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.post('/create-admin', createAdmin);
router.get('/users/stats',       getUserStats);
router.get('/users',             getUsers);
router.put('/users/:id/block',   blockUser);
router.put('/users/:id/unblock', unblockUser);

module.exports = router;
