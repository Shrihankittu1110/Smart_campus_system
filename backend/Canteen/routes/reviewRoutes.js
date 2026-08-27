//backend/Canteen/routes/reviewRoutes.js

const express = require('express');
const { getReviews, replyToReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/',            protect, authorize('canteen'), getReviews);
router.patch('/:id/reply', protect, authorize('canteen'), replyToReview);

module.exports = router;