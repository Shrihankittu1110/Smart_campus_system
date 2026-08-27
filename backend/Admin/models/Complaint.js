const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    submittedByName:  { type: String, required: true },
    submittedByEmail: { type: String, default: '' },
    submitterId:      { type: mongoose.Schema.Types.ObjectId },
    submitterType:    { type: String, enum: ['user', 'canteen'], default: 'user' },
    canteenId: { type: mongoose.Schema.Types.ObjectId, default: null },
     canteenName:      { type: String, default: '' },
    category: {
    type: String,
      enum: ['Bug Issue', 'Performance', 'Feature Idea', 'App Bug', 'Other',
         'Order Issue', 'Food Quality', 'Service', 'Payment'],
  required: true},
    description:      { type: String, required: true },
    attachment:       { type: String },
    status:           { type: String, enum: ['pending','inreview','resolved','closed'], default: 'pending' },
    adminNote:        { type: String },
    emailHistory:     [{ to: String, subject: String, sentAt: Date, sentBy: String }],
  },
  { timestamps: true }
  
);

module.exports = mongoose.model('Complaint', complaintSchema);