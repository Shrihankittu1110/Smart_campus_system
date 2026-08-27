const Payment = require('../models/Payment');

// Get payment by order ID
const getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId })
      .populate('order');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Process mock payment - always success for demo
const processMockPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const payment = await Payment.findOne({ order: orderId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // ✅ Always success for sandbox/demo
    const isSuccess = true;

    payment.status = 'success';
    payment.method = method || payment.method;
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment successful!',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPaymentByOrder, processMockPayment };