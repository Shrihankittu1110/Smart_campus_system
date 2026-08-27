const express = require('express');
const { getComplaintStats, getComplaints, updateComplaintStatus, sendComplaintEmail } = require('../controllers/Complaintcontroller');
const router = express.Router();
router.get('/complaints/stats',       getComplaintStats);
router.get('/complaints',             getComplaints);
router.put('/complaints/:id/status',  updateComplaintStatus);
router.post('/complaints/send-email', sendComplaintEmail);
module.exports = router;