const mongoose = require('../backend/node_modules/mongoose');
const path = require('node:path');

require('../backend/node_modules/dotenv').config({
  path: path.join(__dirname, '..', 'backend', '.env'),
});

const User = require('../backend/Auth/models/User');
const Canteen = require('../backend/models/Canteen');
const Meal = require('../backend/models/Meal');

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in backend/.env');

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email: 'canteen1@gmail.com', role: 'canteen' });
  if (!user) throw new Error('canteen1@gmail.com user was not found');

  user.status = 'approved';
  user.isActive = true;
  user.isBlocked = false;
  await user.save();

  const canteen = await Canteen.findOneAndUpdate(
    { email: 'canteen1@gmail.com' },
    {
      $set: {
        owner: user._id,
        ownerName: user.name,
        name: 'Canteen 1',
        canteenName: 'Canteen 1',
        isApproved: true,
        isActive: true,
      },
    },
    { new: true }
  );

  if (!canteen) throw new Error('Canteen 1 was not found');

  const result = await Meal.updateMany(
    {
      $or: [
        { canteen: { $exists: false } },
        { canteen: null },
        { canteen: '' },
        { canteen: { $ne: canteen._id } },
      ],
    },
    { $set: { canteen: canteen._id, isAvailable: true } }
  );

  console.log(`Linked meals to Canteen 1: ${result.modifiedCount}`);
  console.log(`Canteen owner fixed: ${user.email} -> ${canteen._id}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
