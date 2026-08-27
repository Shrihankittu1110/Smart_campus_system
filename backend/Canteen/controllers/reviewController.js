// backend/Canteen/controllers/reviewController.js
const mongoose = require('mongoose');
const Rating = require('../../models/Rating');

const getCanteenId = async (userId) => {
  const canteen = await mongoose.connection.db.collection('canteens').findOne({
    owner: new mongoose.Types.ObjectId(userId),
  });
  return canteen?._id || null;
};

// GET /api/canteen/reviews
const getReviews = async (req, res) => {
  try {
    const canteenId = await getCanteenId(req.user._id);
    if (!canteenId) return res.status(404).json({ success: false, message: 'Canteen not found' });

    const reviews = await Rating.find({ canteen: canteenId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/canteen/reviews/:id/reply
const replyToReview = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim())
      return res.status(400).json({ success: false, message: 'Reply cannot be empty' });

    const updated = await Rating.findByIdAndUpdate(
      req.params.id,
      { $set: { reply: reply.trim(), repliedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, message: 'Reply sent', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getReviews, replyToReview };