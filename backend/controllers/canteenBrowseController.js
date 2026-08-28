const Canteen = require('../models/Canteen');
const Meal = require('../models/Meal');
const Order = require('../models/Order');
const User = require('../Auth/models/User');

const mealCanteenFilter = (canteenId) => ({
  $or: [{ canteen: canteenId }, { canteen: canteenId.toString() }],
});

const getApprovedCanteenFilters = async () => {
  const approvedOwners = await User.find({
    role: 'canteen',
    status: 'approved',
    isActive: { $ne: false },
    isBlocked: { $ne: true },
  }).select('_id email canteenName');

  const approvedOwnerIds = approvedOwners.map((user) => user._id);
  const approvedOwnerIdStrings = approvedOwnerIds.map((id) => id.toString());
  const approvedEmails = approvedOwners.map((user) => user.email).filter(Boolean);
  const approvedCanteenNames = approvedOwners.map((user) => user.canteenName).filter(Boolean);

  return [
    { isApproved: true },
    { owner: { $in: approvedOwnerIds } },
    { owner: { $in: approvedOwnerIdStrings } },
    { email: { $in: approvedEmails } },
    { canteenName: { $in: approvedCanteenNames } },
    { name: { $in: approvedCanteenNames } },
  ];
};

// Get all approved canteens
const getApprovedCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find({
      isActive: { $ne: false },
      $or: await getApprovedCanteenFilters(),
    }).sort({ canteenName: 1 });

    const normalized = await Promise.all(canteens.map(async (c) => {
      const mealFilter = mealCanteenFilter(c._id);
      const [mealCount, availableMealCount] = await Promise.all([
        Meal.countDocuments(mealFilter),
        Meal.countDocuments({ ...mealFilter, isAvailable: true }),
      ]);

      return {
        ...c.toObject(),
        name: c.name || c.canteenName || 'Unnamed Canteen',
        mealCount,
        availableMealCount,
      };
    }));
    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single canteen by ID
const getCanteenById = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (!canteen) return res.status(404).json({ success: false, message: 'Canteen not found' });
    res.status(200).json({ success: true, data: canteen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get meals by canteen with filters
const getMealsByCanteen = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, available } = req.query;
    let filter = mealCanteenFilter(req.params.canteenId);

    if (category) filter.category = category;
    if (available === 'true') filter.isAvailable = true;

    // ✅ Fix: use basePrice instead of price
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const meals = await Meal.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔍 Global meal search across ALL canteens
const globalMealSearch = async (req, res) => {
  try {
    const { q, category, maxPrice } = req.query;

    let filter = { isAvailable: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') filter.category = category;

    // ✅ Fix: use basePrice instead of price
    if (maxPrice) filter.basePrice = { $lte: Number(maxPrice) };

    const meals = await Meal.find(filter).populate('canteen', 'canteenName name location image isActive isApproved owner email');
    const approvedCanteenFilters = await getApprovedCanteenFilters();

    const filtered = meals.filter(
      (m) => m.canteen && m.canteen.isActive !== false && approvedCanteenFilters.some((approvedFilter) => {
        if (approvedFilter.isApproved) return m.canteen.isApproved === true;
        const [[field, condition]] = Object.entries(approvedFilter);
        const value = m.canteen[field]?.toString();
        return condition.$in?.some((item) => item?.toString() === value);
      })
    );

    res.status(200).json({ success: true, data: filtered, count: filtered.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📊 Get most ordered meals for a student
const getMostOrderedMeals = async (req, res) => {
  try {
    const { studentId } = req.params;

    const orders = await Order.find({
      student: studentId,
      status: { $in: ['completed', 'ready'] },
    });

    const mealCount = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        if (!mealCount[key]) {
          mealCount[key] = { name: item.name, count: 0, totalSpent: 0, price: item.price };
        }
        mealCount[key].count += item.quantity;
        mealCount[key].totalSpent += item.price * item.quantity;
      });
    });

    const sorted = Object.values(mealCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getApprovedCanteens,
  getCanteenById,
  getMealsByCanteen,
  globalMealSearch,
  getMostOrderedMeals,
};
