const mongoose = require('../backend/node_modules/mongoose');
const path = require('node:path');

require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const User = require('../backend/Auth/models/User');
const Canteen = require('../backend/models/Canteen');
const Meal = require('../backend/models/Meal');
const QueueToken = require('../backend/models/QueueToken');

const CANTEEN_LOGIN = {
  name: 'Canteen One Manager',
  email: 'canteen1@gmail.com',
  password: 'canteen1',
  role: 'canteen',
  phone: '7123456789',
  canteenName: 'Canteen 1',
  location: 'Main Campus',
  image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
  licenseNumber: 'CANTEEN-001',
  status: 'approved',
  registrationDocument: '',
  isActive: true,
  isBlocked: false,
};

const operatingHours = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((day) => ({
  day,
  isOpen: day !== 'Sunday',
  openTime: '08:00',
  closeTime: day === 'Saturday' ? '14:00' : '17:00',
}));

const meals = [
  {
    name: 'Chicken Fried Rice',
    description: 'Fresh fried rice with chicken, egg, and vegetables.',
    category: 'Rice',
    basePrice: 350,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=900&q=80',
  },
  {
    name: 'Vegetable Kottu',
    description: 'Chopped roti mixed with vegetables and house spices.',
    category: 'Other',
    basePrice: 300,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=80',
  },
  {
    name: 'Iced Coffee',
    description: 'Cold coffee with milk and light sweetness.',
    category: 'Drinks',
    basePrice: 180,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=900&q=80',
  },
  {
    name: 'Fish Roll',
    description: 'Crispy campus snack with spicy fish filling.',
    category: 'Snacks',
    basePrice: 120,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=900&q=80',
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in backend/.env');

  await mongoose.connect(process.env.MONGO_URI);

  await QueueToken.deleteMany({});
  await Meal.deleteMany({});
  await Canteen.deleteMany({});
  await User.deleteMany({ role: 'canteen' });

  const owner = await User.create(CANTEEN_LOGIN);
  const canteen = await Canteen.create({
    owner: owner._id,
    ownerName: owner.name,
    name: CANTEEN_LOGIN.canteenName,
    canteenName: CANTEEN_LOGIN.canteenName,
    email: owner.email,
    phone: owner.phone,
    location: CANTEEN_LOGIN.location,
    image: CANTEEN_LOGIN.image,
    description: 'Fast daily meals for students and staff.',
    operatingHours,
    isApproved: true,
    isActive: true,
    registrationDocument: '',
  });

  await Meal.insertMany(
    meals.map((meal) => ({
      ...meal,
      canteen: canteen._id,
      image: meal.image,
      defaultSize: 'Medium',
      sizes: {
        Small: { enabled: true, price: Math.max(meal.basePrice - 40, 50) },
        Medium: { enabled: true, price: meal.basePrice },
        Large: { enabled: true, price: meal.basePrice + 60 },
      },
      isAvailable: true,
    }))
  );

  console.log('Canteen seed ready: canteen1@gmail.com / canteen1');
  console.log(`Created 1 canteen with ${meals.length} meals.`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
