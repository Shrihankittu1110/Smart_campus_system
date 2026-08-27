const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema(
  {
    tokenNumber: { type: Number, required: true },
    tokenCode: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canteen: { type: mongoose.Schema.Types.ObjectId, ref: 'Canteen', required: true },
    status: {
      type: String,
      enum: ['waiting', 'completed', 'cancelled'],
      default: 'waiting',
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

queueTokenSchema.index({ canteen: 1, createdAt: 1 });
queueTokenSchema.index({ student: 1, canteen: 1, status: 1 });

module.exports = mongoose.model('QueueToken', queueTokenSchema);
