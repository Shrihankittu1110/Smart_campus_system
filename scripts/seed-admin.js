const mongoose = require('../backend/node_modules/mongoose');
const path = require('node:path');

require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const User = require('../backend/Auth/models/User');

const ADMIN = {
  name: 'System Admin',
  email: 'felix@gmail.com',
  password: 'Shazmina2005',
  role: 'admin',
  phone: '0700000001',
  nic: 'ADMIN-DEMO',
  status: 'approved',
  isActive: true,
  isBlocked: false,
};

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in backend/.env');

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: ADMIN.email, role: 'admin' });
  if (!existing) {
    await User.create(ADMIN);
    console.log(`Admin created: ${ADMIN.email} / ${ADMIN.password}`);
  } else {
    existing.name = existing.name || ADMIN.name;
    existing.phone = existing.phone || ADMIN.phone;
    existing.nic = existing.nic || ADMIN.nic;
    existing.status = 'approved';
    existing.isActive = true;
    existing.isBlocked = false;
    existing.password = ADMIN.password;
    await existing.save();
    console.log(`Admin reset: ${ADMIN.email} / ${ADMIN.password}`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
