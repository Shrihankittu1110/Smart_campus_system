const express = require('express');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');
const { getComplaintStats, getComplaints, updateComplaintStatus, sendComplaintEmail } = require('../controllers/Complaintcontroller');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/complaints/stats',       getComplaintStats);
router.get('/complaints',             getComplaints);
router.put('/complaints/:id/status',  updateComplaintStatus);
router.post('/complaints/send-email', sendComplaintEmail);
module.exports = router;
