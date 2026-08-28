const mongoose = require('mongoose');
const User = require('../../Auth/models/User');
const Canteen = require('../../models/Canteen');

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
};

const compactUnique = (values) => [...new Set(values.filter(Boolean).map((value) => value.toString()))];

const getCanteenIdentity = (canteen) => {
  const idStrings = compactUnique([canteen._id, canteen.owner]);
  const objectIds = idStrings.map(toObjectId).filter(Boolean);
  const names = compactUnique([canteen.canteenName, canteen.name]);
  const emails = compactUnique([canteen.email, canteen.ownerEmail]);

  return { idStrings, objectIds, names, emails };
};

const buildOrderCanteenFilter = (canteen) => {
  const { idStrings, objectIds, names, emails } = getCanteenIdentity(canteen);
  const clauses = [];

  if (objectIds.length) {
    clauses.push({ canteen: { $in: objectIds } });
    clauses.push({ canteenId: { $in: objectIds } });
  }
  if (idStrings.length) {
    clauses.push({ canteen: { $in: idStrings } });
    clauses.push({ canteenId: { $in: idStrings } });
  }
  if (names.length) {
    clauses.push({ canteenName: { $in: names } });
  }
  if (emails.length) {
    clauses.push({ canteenEmail: { $in: emails } });
  }

  return clauses.length ? { $or: clauses } : { _id: null };
};

const buildComplaintCanteenFilter = (canteen) => {
  const { idStrings, objectIds, names } = getCanteenIdentity(canteen);
  const clauses = [];

  if (objectIds.length) clauses.push({ canteenId: { $in: objectIds } });
  if (idStrings.length) clauses.push({ canteenId: { $in: idStrings } });
  if (names.length) clauses.push({ canteenName: { $in: names } });

  return clauses.length ? { $or: clauses } : { _id: null };
};

const buildRelatedDocFilter = (canteen) => {
  const { idStrings, objectIds, names, emails } = getCanteenIdentity(canteen);
  const clauses = [];

  if (objectIds.length) clauses.push({ canteen: { $in: objectIds } });
  if (idStrings.length) clauses.push({ canteen: { $in: idStrings } });
  if (names.length) clauses.push({ canteenName: { $in: names } });
  if (emails.length) clauses.push({ email: { $in: emails } });

  return clauses.length ? { $or: clauses } : { _id: null };
};

const ensureApprovedCanteenDocuments = async () => {
  const approvedOwners = await User.find({ role: 'canteen', status: 'approved' })
    .select('name email phone canteenName location licenseNumber registrationDocument createdAt')
    .lean();

  await Promise.all(approvedOwners.map(async (owner) => {
    const ownerId = owner._id;
    const canteenName = owner.canteenName || owner.name || 'Unnamed Canteen';
    const filters = [
      { owner: ownerId },
      { owner: ownerId.toString() },
    ];

    if (owner.email) filters.push({ email: owner.email });
    if (canteenName) filters.push({ canteenName }, { name: canteenName });

    const existing = await Canteen.findOne({ $or: filters });
    const update = {
      owner: ownerId,
      ownerName: owner.name,
      canteenName,
      name: canteenName,
      email: owner.email,
      phone: owner.phone || '',
      location: owner.location || '',
      registrationDocument: owner.registrationDocument || '',
      isApproved: true,
    };

    if (existing) {
      if (existing.isActive === undefined) update.isActive = true;
      await Canteen.updateOne({ _id: existing._id }, { $set: update });
      return;
    }

    await Canteen.create({ ...update, isActive: true });
  }));

  return Canteen.find({ isApproved: true }).sort({ canteenName: 1 }).lean();
};

const revenueSumExpression = {
  $ifNull: [
    '$totalAmount',
    { $ifNull: ['$amount', { $ifNull: ['$total', 0] }] },
  ],
};

module.exports = {
  buildComplaintCanteenFilter,
  buildOrderCanteenFilter,
  buildRelatedDocFilter,
  ensureApprovedCanteenDocuments,
  revenueSumExpression,
};
