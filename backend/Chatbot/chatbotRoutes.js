const express = require('express');
const router = express.Router();
const { protect } = require('../Auth/middleware/authMiddleware');
const { sendMessage } = require('./chatbotController');

// POST /api/chatbot/message — protected, all roles
router.post('/message', protect, sendMessage);

module.exports = router;
