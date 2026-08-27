const mongoose = require('mongoose');
const User    = require('../../Auth/models/User');
const Canteen = require('../../models/Canteen');
const { logActivity } = require('./dashboardController');

const getCollection = (name) => mongoose.connection.db.collection(name);
const mealCanteenFilter = (canteenId) => ({
  $or: [{ canteen: canteenId }, { canteen: canteenId.toString() }],
});

// ── GET /api/admin/canteens/stats ─────────────────────────────────────────────
const getCanteenStats = async (req, res) => {
  try {
    const [approved, pending, rejected] = await Promise.all([
      getCollection('canteens').countDocuments({ isApproved: true }),
      User.countDocuments({ role: 'canteen', status: 'pending' }),
      User.countDocuments({ role: 'canteen', status: 'rejected' }),
    ]);
    res.json({ success: true, data: { approved, pending, rejected } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/canteens/visibility-stats ──────────────────────────────────
const getVisibilityStats = async (req, res) => {
  try {
    const [operating, visible, hidden] = await Promise.all([
      getCollection('canteens').countDocuments({ isApproved: true }),
      getCollection('canteens').countDocuments({ isApproved: true, isActive: true }),
      getCollection('canteens').countDocuments({ isApproved: true, isActive: { $ne: true } }),
    ]);
    res.json({ success: true, data: { operating, visible, hidden } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/canteens?status=pending|approved|rejected|all ──────────────
const getCanteens = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    if (status === 'pending' || status === 'rejected') {
      const users = await User.find({ role: 'canteen', status })
        .select('-password')
        .sort({ createdAt: -1 });

      const data = users.map(u => ({
        _id:                  u._id,
        name:                 u.canteenName,
        ownerName:            u.name,
        ownerEmail:           u.email,
        phone:                u.phone,
        location:             u.location,
        licenseNumber:        u.licenseNumber,
        registrationDocument: u.registrationDocument,
        status:               u.status,
        rejectionReason:      u.rejectionReason,
        createdAt:            u.createdAt,
        isApproved:           false,
        isRejected:           status === 'rejected',
        documents:            u.registrationDocument ? [u.registrationDocument] : [],
      }));

      return res.json({ success: true, data });
    }

    let filter = {};
    if (status === 'approved') filter = { isApproved: true };

    const canteens = await getCollection('canteens')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const enriched = await Promise.all(canteens.map(async (c) => {
      const canteenObjId = typeof c._id === 'string'
        ? new mongoose.Types.ObjectId(c._id)
        : c._id;

      const ownerObjId = c.owner
        ? (typeof c.owner === 'string' ? new mongoose.Types.ObjectId(c.owner) : c.owner)
        : null;

      const [orderCount, complaintCount, ratingAgg, ownerUser, mealCount, availableMealCount] = await Promise.all([
        // ✅ cast to ObjectId explicitly
        getCollection('orders').countDocuments({ canteen: canteenObjId }),

        // ✅ count complaints by canteenId
        getCollection('complaints').countDocuments({ canteenId: canteenObjId }),

        // ratings — aggregate avg and count
        getCollection('ratings').aggregate([
          { $match: { canteen: canteenObjId } },
          { $group: {
              _id:           null,
              averageRating: { $avg: '$rating' },
              totalRatings:  { $sum: 1 },
          }},
        ]).toArray(),

        ownerObjId
          ? User.findById(ownerObjId).select('email registrationDocument').lean()
          : Promise.resolve(null),
        getCollection('meals').countDocuments(mealCanteenFilter(canteenObjId)),
        getCollection('meals').countDocuments({ ...mealCanteenFilter(canteenObjId), isAvailable: true }),
      ]);

      const avg = ratingAgg[0];

      return {
        ...c,
        name:          c.canteenName || c.name,
        orderCount,
        complaintCount,
        averageRating: avg ? parseFloat(avg.averageRating.toFixed(1)) : 0,
        totalRatings:  avg ? avg.totalRatings : 0,
        mealCount,
        availableMealCount,
        ownerEmail:    c.email || ownerUser?.email || '—',
        documents:     c.documents?.length
          ? c.documents
          : c.registrationDocument
            ? [c.registrationDocument]
            : ownerUser?.registrationDocument
              ? [ownerUser.registrationDocument]
              : [],
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/admin/canteens/approved-list ─────────────────────────────────────
const getApprovedCanteens = async (req, res) => {
  try {
    const canteens = await getCollection('canteens')
      .find({ isApproved: true })
      .sort({ canteenName: 1 })
      .toArray();

    const enriched = await Promise.all(canteens.map(async (c) => {
      // Ensure proper ObjectId types for queries
      const canteenObjId = typeof c._id === 'string'
        ? new mongoose.Types.ObjectId(c._id)
        : c._id;

      const ownerObjId = c.owner
        ? (typeof c.owner === 'string' ? new mongoose.Types.ObjectId(c.owner) : c.owner)
        : null;

      const [orderCount, complaintCount, ratingAgg, ownerUser, mealCount, availableMealCount] = await Promise.all([

        // ✅ Fix 1: cast to ObjectId explicitly
        getCollection('orders').countDocuments({ canteen: canteenObjId }),

        // ✅ Fix 2: count complaints where canteenId matches this canteen
        getCollection('complaints').countDocuments({ canteenId: canteenObjId }),

        // ✅ Fix 3: ratings were never fetched — aggregate avg + count
        getCollection('ratings').aggregate([
          { $match: { canteen: canteenObjId } },
          { $group: {
              _id:           null,
              averageRating: { $avg: '$rating' },
              totalRatings:  { $sum: 1 },
          }},
        ]).toArray(),

        ownerObjId
          ? User.findById(ownerObjId).select('email registrationDocument').lean()
          : Promise.resolve(null),
        getCollection('meals').countDocuments(mealCanteenFilter(canteenObjId)),
        getCollection('meals').countDocuments({ ...mealCanteenFilter(canteenObjId), isAvailable: true }),
      ]);

      const avg = ratingAgg[0]; // will be undefined if no ratings exist

      return {
        ...c,
        name:          c.canteenName || c.name,
        // orders
        totalOrders:   orderCount,
        orderCount,    // keep for backward compat with getCanteens usage
        // complaints
        complaintCount,
        // ratings
        averageRating: avg ? parseFloat(avg.averageRating.toFixed(1)) : 0,
        totalRatings:  avg ? avg.totalRatings : 0,
        mealCount,
        availableMealCount,
        // owner info
        ownerEmail:    c.email || ownerUser?.email || '—',
        documents:     c.documents?.length
          ? c.documents
          : c.registrationDocument
            ? [c.registrationDocument]
            : ownerUser?.registrationDocument
              ? [ownerUser.registrationDocument]
              : [],
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/canteens/:id/approve ───────────────────────────────────────
const approveCanteen = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existing = await Canteen.findOne({ owner: user._id });

    if (!existing) {
      await Canteen.create({
        owner:                user._id,
        ownerName:            user.name,
        name:                 user.canteenName,
        canteenName:          user.canteenName,
        email:                user.email,
        phone:                user.phone,
        location:             user.location,
        isApproved:           true,
        isActive:             true,
        registrationDocument: user.registrationDocument || '',
      });
    } else {
      await Canteen.findOneAndUpdate(
        { owner: user._id },
        {
          isApproved:           true,
          isActive:             true,
          email:                existing.email || user.email,
          registrationDocument: existing.registrationDocument || user.registrationDocument || '',
        }
      );
    }

    await logActivity({
      type:        'CANTEEN_APPROVED',
      description: `Canteen approved: ${user.canteenName}`,
      performedBy: { userId: req.user?._id, name: req.user?.name || 'Admin', role: 'Admin' },
    });

    res.json({ success: true, message: 'Canteen approved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/canteens/:id/reject ────────────────────────────────────────
const rejectCanteen = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await logActivity({
      type:        'CANTEEN_REJECTED',
      description: `Canteen rejected: ${user.canteenName}${reason ? ` — ${reason}` : ''}`,
      performedBy: { userId: req.user?._id, name: req.user?.name || 'Admin', role: 'Admin' },
    });

    res.json({ success: true, message: 'Canteen rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET pending canteens from User collection ─────────────────────────────────
const getPendingCanteens = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const users = await User.find({ role: 'canteen', status }).select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/canteens/:id/visibility ────────────────────────────────────
const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await getCollection('canteens').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { isActive: Boolean(isActive) } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ success: false, message: 'Canteen not found' });

    res.json({ success: true, message: `Canteen ${isActive ? 'shown' : 'hidden'} successfully`, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCanteenStats,
  getVisibilityStats,
  getCanteens,
  getApprovedCanteens,
  approveCanteen,
  rejectCanteen,
  toggleVisibility,
  getPendingCanteens,
};
