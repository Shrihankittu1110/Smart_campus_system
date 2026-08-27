// backend/Canteen/controllers/mealController.js
const mongoose = require('mongoose');
const multer   = require('multer');
const Meal     = require('../../models/Meal');

const getCanteenId = async (userId) => {
  const canteen = await mongoose.connection.db.collection('canteens').findOne({
    owner: new mongoose.Types.ObjectId(userId),
  });
  return canteen?._id || null;
};

const mealCanteenFilter = (canteenId) => ({
  $or: [{ canteen: canteenId }, { canteen: canteenId.toString() }],
});

const storage    = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPG, PNG, WEBP allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── helpers ───────────────────────────────────────────────────────────────────
const parseSizes = (rawSizes) => {
  
  let parsed = {};
  try { parsed = typeof rawSizes === 'string' ? JSON.parse(rawSizes) : rawSizes; } catch { parsed = {}; }

  const result = {};
  ['Small', 'Medium', 'Large'].forEach((size) => {
    const s = parsed[size] || {};

    const enabled = s.enabled === true || s.enabled === 'true';
    const price   = parseFloat(s.price);
    result[size]  = { enabled, price: isNaN(price) ? 0 : price };
  });
  return result;
};

const validateMealBody = (body) => {
  const { name, description, category, basePrice, sizes, defaultSize } = body;
  if (!name || !name.trim())
    return 'Meal name is required';
  if (!/^[a-zA-Z\s]+$/.test(name.trim()))
    return 'Meal name must contain letters only (no numbers or symbols)';
  if (!category)
    return 'Category is required';
  if (basePrice === undefined || basePrice === null || basePrice === '')
    return 'Base price is required';
  const p = parseFloat(basePrice);
  if (isNaN(p) || p < 0)
    return 'Enter a valid base price';
  if (description?.trim() && !/^[a-zA-Z\s]+$/.test(description.trim()))
    return 'Description must contain letters only (no numbers or symbols)';

  // validate that at least one size is enabled
  let parsedSizes = {};
  try { parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : (sizes || {}); } catch { parsedSizes = {}; }
  
  const isSizeEnabled = (s) => s?.enabled === true || s?.enabled === 'true';
  const anyEnabled = ['Small', 'Medium', 'Large'].some(s => isSizeEnabled(parsedSizes[s]));
  if (!anyEnabled)
    return 'At least one size must be enabled';

  // validate defaultSize is one of the enabled sizes
  const validSizes = ['Small', 'Medium', 'Large'];
  if (!validSizes.includes(defaultSize))
    return 'Invalid default size';
  if (!isSizeEnabled(parsedSizes[defaultSize]))
    return 'Default size must be an enabled size';

  return null;
};

// ── GET /api/canteen/meals ────────────────────────────────────────────────────
const getMeals = async (req, res) => {
  try {
    const canteenId = await getCanteenId(req.user._id);
    if (!canteenId)
      return res.status(404).json({ success: false, message: 'Canteen not found' });

    const meals = await Meal.find(mealCanteenFilter(canteenId)).sort({ createdAt: -1 });
    res.json({ success: true, data: meals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/canteen/meals ───────────────────────────────────────────────────
const addMeal = async (req, res) => {
  try {
    const canteenId = await getCanteenId(req.user._id);
    if (!canteenId)
      return res.status(404).json({ success: false, message: 'Canteen not found' });

    const error = validateMealBody(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const { name, description, category, basePrice, isAvailable, sizes, defaultSize } = req.body;
    const parsedPrice = parseFloat(basePrice);
    const parsedSizes = parseSizes(sizes);

    // FIX: trust the client's defaultSize — validation above already confirmed it's valid
    const meal = await Meal.create({
      canteen:     canteenId,
      name:        name.trim(),
      description: description?.trim() || '',
      category:    category || 'Other',
      basePrice:   parsedPrice,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      defaultSize: defaultSize,
      sizes:       parsedSizes,
      image: req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : null,
    });

    res.json({ success: true, message: 'Meal added', data: meal });
  } catch (err) {
    console.error('addMeal ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/canteen/meals/:id ────────────────────────────────────────────────
const updateMeal = async (req, res) => {
  try {
    const error = validateMealBody(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const { name, description, category, basePrice, isAvailable, sizes, defaultSize } = req.body;
    const parsedPrice = parseFloat(basePrice);
    const parsedSizes = parseSizes(sizes);

    // FIX: trust the client's defaultSize — validation above already confirmed it's valid
    const updateData = {
      name:        name.trim(),
      description: description?.trim() || '',
      category:    category || 'Other',
      basePrice:   parsedPrice,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      defaultSize: defaultSize,
      sizes:       parsedSizes,
    };

    if (req.file)
      updateData.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });

    res.json({ success: true, message: 'Meal updated', data: meal });
  } catch (err) {
    console.error('updateMeal ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/canteen/meals/:id/availability ─────────────────────────────────
const toggleAvailability = async (req, res) => {
  try {
    await Meal.findByIdAndUpdate(req.params.id, { $set: { isAvailable: req.body.isAvailable } });
    res.json({ success: true, message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/canteen/meals/:id ─────────────────────────────────────────────
const deleteMeal = async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, getMeals, addMeal, updateMeal, toggleAvailability, deleteMeal };
