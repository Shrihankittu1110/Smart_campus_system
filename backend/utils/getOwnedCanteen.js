const mongoose = require('mongoose');
const Canteen = require('../models/Canteen');

const asObjectId = (id) => (
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
);

const getOwnedCanteen = async (user) => {
  if (!user?._id) return null;

  const ownerId = asObjectId(user._id);
  let canteen = await Canteen.findOne({ owner: ownerId });
  if (canteen) return canteen;

  const email = user.email?.toLowerCase().trim();
  if (!email) return null;

  canteen = await Canteen.findOne({ email });
  if (!canteen) return null;

  if (!canteen.owner || canteen.owner.toString() !== ownerId.toString()) {
    canteen.owner = ownerId;
    if (!canteen.ownerName && user.name) canteen.ownerName = user.name;
    await canteen.save();
  }

  return canteen;
};

module.exports = getOwnedCanteen;
