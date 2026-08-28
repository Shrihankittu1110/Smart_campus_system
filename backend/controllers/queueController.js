const mongoose = require('mongoose');
const QueueToken = require('../models/QueueToken');
const Canteen = require('../models/Canteen');
const Order = require('../models/Order');
const User = require('../Auth/models/User');
const getOwnedCanteen = require('../utils/getOwnedCanteen');

const AVG_SERVICE_MINUTES = 5;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const todayFilter = () => ({ $gte: startOfToday(), $lte: endOfToday() });

const isCanteenAvailable = async (canteen) => {
  if (!canteen || canteen.isActive === false) return false;
  if (canteen.isApproved === true) return true;

  const ownerFilters = [];
  if (canteen.owner) {
    ownerFilters.push({ _id: canteen.owner });
    if (mongoose.Types.ObjectId.isValid(canteen.owner)) {
      ownerFilters.push({ _id: new mongoose.Types.ObjectId(canteen.owner) });
    }
  }
  if (canteen.email) ownerFilters.push({ email: canteen.email });
  if (canteen.canteenName) ownerFilters.push({ canteenName: canteen.canteenName });
  if (canteen.name) ownerFilters.push({ canteenName: canteen.name });
  if (!ownerFilters.length) return false;

  const owner = await User.findOne({
    role: 'canteen',
    status: 'approved',
    isActive: { $ne: false },
    isBlocked: { $ne: true },
    $or: ownerFilters,
  });

  return Boolean(owner);
};

const buildQueueStatus = async (canteenId, studentId = null) => {
  const waitingTokens = await QueueToken.find({
    canteen: canteenId,
    status: 'waiting',
    createdAt: todayFilter(),
  })
    .populate('student', 'name email phone')
    .sort({ createdAt: 1 });

  const completedToday = await QueueToken.countDocuments({
    canteen: canteenId,
    status: 'completed',
    completedAt: todayFilter(),
  });

  const myToken = studentId
    ? waitingTokens.find((token) => token.student?._id?.toString() === studentId.toString()) || null
    : null;
  const position = myToken ? waitingTokens.findIndex((token) => token._id.equals(myToken._id)) : -1;

  return {
    currentToken: waitingTokens[0] || null,
    waitingCount: waitingTokens.length,
    completedToday,
    averageServiceMinutes: AVG_SERVICE_MINUTES,
    estimatedWaitMinutes: Math.max(position, 0) * AVG_SERVICE_MINUTES,
    myPosition: position >= 0 ? position + 1 : null,
    myToken,
    tokens: waitingTokens,
  };
};

const createTokenForOrder = async ({ orderId, studentId, canteenId }) => {
  const existingForOrder = orderId
    ? await QueueToken.findOne({ order: orderId, status: 'waiting', createdAt: todayFilter() })
    : null;

  if (existingForOrder) {
    return buildQueueStatus(canteenId, studentId);
  }

  const existingForStudent = await QueueToken.findOne({
    canteen: canteenId,
    student: studentId,
    status: 'waiting',
    createdAt: todayFilter(),
  });

  if (existingForStudent) {
    if (orderId && !existingForStudent.order) {
      existingForStudent.order = orderId;
      await existingForStudent.save();
    }
    return buildQueueStatus(canteenId, studentId);
  }

  const todayCount = await QueueToken.countDocuments({
    canteen: canteenId,
    createdAt: todayFilter(),
  });
  const tokenNumber = todayCount + 1;

  await QueueToken.create({
    tokenNumber,
    tokenCode: `Q-${String(tokenNumber).padStart(3, '0')}`,
    student: studentId,
    canteen: canteenId,
    order: orderId || null,
  });

  return buildQueueStatus(canteenId, studentId);
};

const getStatus = async (req, res) => {
  try {
    const { canteenId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ success: false, message: 'Valid canteenId is required' });
    }

    const status = await buildQueueStatus(canteenId, req.user?._id);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createToken = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Place an order before generating a queue token.',
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      student: req.user._id,
      status: { $ne: 'cancelled' },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No eligible order found for this queue token.',
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before a queue token is generated.',
      });
    }

    const canteenId = order.canteen;
    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ success: false, message: 'Valid canteenId is required' });
    }

    const canteen = await Canteen.findById(canteenId);
    if (!(await isCanteenAvailable(canteen))) {
      return res.status(404).json({ success: false, message: 'Canteen is not available' });
    }

    const status = await createTokenForOrder({
      orderId: order._id,
      studentId: req.user._id,
      canteenId,
    });
    res.status(201).json({ success: true, message: 'Queue token generated', data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyToken = async (req, res) => {
  try {
    const token = await QueueToken.findOne({
      student: req.user._id,
      status: 'waiting',
      createdAt: todayFilter(),
    })
      .populate('canteen', 'canteenName name location')
      .populate('order', '_id totalAmount status paymentStatus')
      .sort({ createdAt: -1 });

    if (!token) return res.json({ success: true, data: null });

    const status = await buildQueueStatus(token.canteen._id, req.user._id);
    res.json({ success: true, data: { token, status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStaffQueue = async (req, res) => {
  try {
    const canteen = await getOwnedCanteen(req.user);
    if (!canteen) return res.status(404).json({ success: false, message: 'Canteen not found' });

    const status = await buildQueueStatus(canteen._id);
    res.json({ success: true, data: { canteen, ...status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeToken = async (req, res) => {
  try {
    const canteen = await getOwnedCanteen(req.user);
    if (!canteen) return res.status(404).json({ success: false, message: 'Canteen not found' });

    const token = await QueueToken.findOneAndUpdate(
      { _id: req.params.id, canteen: canteen._id, status: 'waiting' },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );

    if (!token) return res.status(404).json({ success: false, message: 'Active token not found' });

    const status = await buildQueueStatus(canteen._id);
    res.json({ success: true, message: 'Token marked completed', data: { completed: token, ...status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStatus,
  createToken,
  getMyToken,
  getStaffQueue,
  completeToken,
  createTokenForOrder,
};
