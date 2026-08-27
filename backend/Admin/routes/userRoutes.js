const express = require('express');
const { getUserStats, getUsers, blockUser, unblockUser, createAdmin } = require('../controllers/userController');
const router = express.Router();

router.post('/create-admin', createAdmin);
router.get('/users/stats',       getUserStats);
router.get('/users',             getUsers);
router.put('/users/:id/block',   blockUser);
router.put('/users/:id/unblock', unblockUser);
router.get('/users/debug', async (req, res) => {
  const mongoose = require('mongoose');
  const all = await mongoose.connection.db.collection('users').find({}).toArray();
  res.json({ count: all.length, roles: all.map(u => u.role), data: all });
});
module.exports = router;