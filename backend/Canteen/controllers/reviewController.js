// backend/Canteen/controllers/reviewController.js
const mongoose = require('mongoose');
const Rating = require('../../models/Rating');
const Complaint = require('../../Admin/models/Complaint');
const getOwnedCanteen = require('../../utils/getOwnedCanteen');

const getCanteenId = async (user) => {
  const canteen = await getOwnedCanteen(user);
  return canteen?._id || null;
};

// GET /api/canteen/reviews
const getReviews = async (req, res) => {
  try {
    const canteenId = await getCanteenId(req.user);
    if (!canteenId) return res.status(404).json({ success: false, message: 'Canteen not found' });

    const [reviews, inquiries] = await Promise.all([
      Rating.find({ canteen: canteenId }).sort({ createdAt: -1 }),
      Complaint.find({ canteenId }).sort({ createdAt: -1 }),
    ]);

    const inquiryFeedback = inquiries.map((inquiry) => ({
      _id: inquiry._id,
      type: 'inquiry',
      studentName: inquiry.submittedByName,
      studentEmail: inquiry.submittedByEmail,
      mealName: inquiry.category,
      rating: 0,
      comment: inquiry.description,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
    }));

    const data = [...reviews.map((review) => review.toObject()), ...inquiryFeedback]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data });
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
