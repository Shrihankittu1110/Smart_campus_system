const express = require('express');
const router = express.Router();
const Complaint = require('../Admin/models/Complaint');
const { logActivity } = require('../Admin/controllers/dashboardController');
const multer = require('multer');
const mongoose = require('mongoose');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const {
      submittedByName,
      submittedByEmail,
      submitterId,
      canteenId,
      category,
      description,
    } = req.body;

    const complaint = new Complaint({
      submittedByName,
      submittedByEmail: submittedByEmail || '',
      submitterId:      submitterId || undefined,
      canteenId:        canteenId && mongoose.Types.ObjectId.isValid(canteenId)
                          ? new mongoose.Types.ObjectId(canteenId)
                          : null,
      submitterType:    'user',
      category,
      description,
      status:           'pending',
    });

    await complaint.save();

    // ✅ Respond immediately
    res.status(201).json({ success: true, message: 'Complaint submitted successfully!', data: complaint });

    // ✅ Save image in background
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      complaint.updateOne({ attachment: base64 }).catch(() => {});
    }

    // ✅ Log in background
    logActivity({
      type:        'COMPLAINT_SUBMITTED',
      description: `Student "${submittedByName || 'Unknown'}" submitted a complaint: ${category}`,
      performedBy: { userId: submitterId, name: submittedByName || 'Student', role: 'Student' },
      meta:        { category, canteenId },
    }).catch(() => {});

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;