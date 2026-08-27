const mongoose = require('mongoose');
const Canteen = require('../models/Canteen');

const getOwnedCanteen = async (user) => {
  if (!user?._id) return null;

  const ownerId = user._id;
  const ownerObjectId = mongoose.Types.ObjectId.isValid(ownerId)
    ? new mongoose.Types.ObjectId(ownerId)
    : ownerId;
  const ownerString = ownerId.toString();
  const email = user.email?.toLowerCase().trim();
  const canteenName = user.canteenName?.trim();

  const filters = [{ owner: ownerObjectId }, { owner: ownerString }];
  if (email) filters.push({ email });
  if (canteenName) filters.push({ canteenName }, { name: canteenName });

  const canteen = await Canteen.findOne({ $or: filters });
  if (!canteen) return null;

  if (!canteen.owner || canteen.owner.toString() !== ownerString) {
    canteen.owner = ownerObjectId;
    if (!canteen.ownerName && user.name) canteen.ownerName = user.name;
    if (!canteen.email && email) canteen.email = email;
    await canteen.save();
  }

  return canteen;
};

module.exports = getOwnedCanteen;
