const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'ORDER_PLACED', 'ORDER_CANCELLED', 'ORDER_COMPLETED',
        'CANTEEN_APPROVED', 'CANTEEN_REJECTED', 'CANTEEN_REGISTERED',
        'MEAL_ADDED', 'MEAL_UPDATED', 'MEAL_DELETED',
        'USER_REGISTERED', 'USER_BLOCKED', 'USER_UNBLOCKED',
        'COMPLAINT_SUBMITTED', 'COMPLAINT_RESOLVED', 'CANTEEN_VISIBLE',
         'CANTEEN_HIDDEN',            
      ],
      required: true,
    },
    description: { type: String, required: true },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId },
      name:   { type: String },
      role:   { type: String, enum: ['Student', 'Canteen', 'Admin'] },
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
