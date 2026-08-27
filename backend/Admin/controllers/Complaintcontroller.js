const mongoose  = require('mongoose');
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');
const { logActivity } = require('./dashboardController');
const getCollection = (name) => mongoose.connection.db.collection(name);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const sendAutoEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — set EMAIL_USER and EMAIL_PASS in .env');
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `SmartMess Admin <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
  }
};

const statusEmailTemplates = {
  inreview: (name, id) => ({
    subject: `Your Complaint #${id} is Now Under Review — SmartMess`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <div style="background:#6366f1;padding:20px;border-radius:8px;margin-bottom:20px">
          <h2 style="color:#fff;margin:0;font-size:18px">SmartMess</h2>
          <p style="color:#c7d2fe;margin:4px 0 0;font-size:13px">Complaint Management System</p>
        </div>
        <h3 style="color:#1f2937">Hi ${name},</h3>
        <p style="color:#4b5563">Your complaint <strong>#${id}</strong> has been received and is now <strong>under review</strong> by our admin team.</p>
        <p style="color:#4b5563">We'll get back to you as soon as possible. Thank you for your patience.</p>
        <div style="background:#eff6ff;border-left:4px solid #6366f1;padding:12px 16px;border-radius:4px;margin:20px 0">
          <p style="margin:0;color:#3730a3;font-size:13px">Complaint ID: <strong>#${id}</strong> · Status: <strong>In Review</strong></p>
        </div>
        <p style="color:#9ca3af;font-size:12px">SmartMess Admin Team</p>
      </div>`,
  }),
  resolved: (name, id) => ({
    subject: `Your Complaint #${id} Has Been Resolved — SmartMess`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <div style="background:#16a34a;padding:20px;border-radius:8px;margin-bottom:20px">
          <h2 style="color:#fff;margin:0;font-size:18px">SmartMess</h2>
          <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px">Complaint Management System</p>
        </div>
        <h3 style="color:#1f2937">Hi ${name},</h3>
        <p style="color:#4b5563">Great news! Your complaint <strong>#${id}</strong> has been <strong>resolved</strong>.</p>
        <p style="color:#4b5563">We hope this resolves your issue. If you have any further concerns, please don't hesitate to reach out.</p>
        <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;margin:20px 0">
          <p style="margin:0;color:#166534;font-size:13px">Complaint ID: <strong>#${id}</strong> · Status: <strong>Resolved ✓</strong></p>
        </div>
        <p style="color:#9ca3af;font-size:12px">SmartMess Admin Team</p>
      </div>`,
  }),
  closed: (name, id) => ({
    subject: `Your Complaint #${id} Has Been Closed — SmartMess`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h3 style="color:#1f2937">Hi ${name},</h3>
        <p style="color:#4b5563">Your complaint <strong>#${id}</strong> has been <strong>closed</strong>.</p>
        <p style="color:#4b5563">If you believe this was closed in error, please submit a new complaint.</p>
        <p style="color:#9ca3af;font-size:12px">SmartMess Admin Team</p>
      </div>`,
  }),
};

// ── GET /api/admin/complaints/stats ───────────────────────────────────────────
const getComplaintStats = async (req, res) => {
  try {
    const [total, pending, resolved] = await Promise.all([
      getCollection('complaints').countDocuments({}),
      getCollection('complaints').countDocuments({ status: 'pending' }),
      getCollection('complaints').countDocuments({ status: 'resolved' }),
    ]);
    res.json({ success: true, data: { total, pending, resolved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/complaints ─────────────────────────────────────────────────
const getComplaints = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      getCollection('complaints').aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'canteens', localField: 'canteenId', foreignField: '_id', as: 'canteenData',
          },
        },
        {
          $addFields: {
            canteenName: {
              $ifNull: [
                { $arrayElemAt: ['$canteenData.name', 0] },
                { $ifNull: [
                    { $arrayElemAt: ['$canteenData.canteenName', 0] },
                    { $ifNull: ['$canteenName', '—'] },
                  ]
                },
              ],
            },
          },
        },
        { $project: { canteenData: 0 } },
      ]).toArray(),
      getCollection('complaints').countDocuments({}),
    ]);

    res.json({ success: true, data: complaints, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/complaints/:id/status ──────────────────────────────────────
const updateComplaintStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'inreview', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await getCollection('complaints').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Complaint not found' });

    logActivity({
      type: 'COMPLAINT_RESOLVED',
      description: `Complaint #${String(id).slice(-6).toUpperCase()} marked as ${status}`,
      performedBy: { userId: req.user?._id, name: req.user?.name || 'Admin', role: 'Admin' },
    }).catch(() => {});

    const email    = result.submittedByEmail;
    const name     = result.submittedByName || 'User';
    const shortId  = String(id).slice(-6).toUpperCase();
    const template = statusEmailTemplates[status];
    if (template && email) {
      const { subject, html } = template(name, shortId);
      sendAutoEmail(email, subject, html).catch(() => {});
    }

    res.json({ success: true, message: `Status updated to ${status}`, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/complaints/send-email ─────────────────────────────────────
const sendComplaintEmail = async (req, res) => {
  try {
    const { complaintId, to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: 'to, subject and body are required' });
    }

    const shortId = complaintId ? String(complaintId).slice(-6).toUpperCase() : '??????';

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <div style="background:#1e1b4b;padding:20px;border-radius:8px;margin-bottom:20px">
          <h2 style="color:#fff;margin:0;font-size:18px">SmartMess Admin</h2>
          <p style="color:#c7d2fe;margin:4px 0 0;font-size:12px">Re: Complaint #${shortId}</p>
        </div>
        <div style="white-space:pre-wrap;color:#374151;font-size:14px;line-height:1.6">${body.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="color:#9ca3af;font-size:12px">This email was sent by the SmartMess Admin team regarding complaint #${shortId}.</p>
      </div>`;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(503).json({ success: false, message: 'Email service not configured. Add EMAIL_USER and EMAIL_PASS to your .env file.' });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `SmartMess Admin <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });

    if (complaintId) {
      getCollection('complaints').updateOne(
        { _id: new mongoose.Types.ObjectId(complaintId) },
        { $push: { emailHistory: { to, subject, sentAt: new Date(), sentBy: req.user?.name || 'Admin' } } }
      ).catch(() => {});
    }

    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getComplaintStats, getComplaints, updateComplaintStatus, sendComplaintEmail };