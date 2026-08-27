// backend/controllers/cartController.js

const Cart = require('../models/Cart');
const Meal = require('../models/Meal');

// ── Helper: return a fully-populated cart so the frontend always gets
//    item.meal as an object (with image, name, price) — never a bare ID.
const populatedCart = (studentId) =>
  Cart.findOne({ student: studentId })
    .populate('items.meal')
    .populate('canteen');

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/student/cart/:studentId
// ─────────────────────────────────────────────────────────────────────────────
const getCart = async (req, res) => {
  try {
    const cart = await populatedCart(req.params.studentId);
    if (!cart) return res.status(200).json({ success: true, data: null });

    // Back-fill price in case any item has 0
    cart.items.forEach((item) => {
      if (!item.price || item.price === 0) {
        item.price = item.meal?.basePrice || item.meal?.price || 0;
      }
    });

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/cart/add
// ─────────────────────────────────────────────────────────────────────────────
const addToCart = async (req, res) => {
  try {
    const { studentId, mealId, quantity } = req.body;

    const meal = await Meal.findById(mealId);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found' });
    if (meal.isAvailable === false)
      return res.status(400).json({ success: false, message: 'Meal not available' });

    const mealPrice = meal.basePrice || meal.price || 0;

    let cart = await Cart.findOne({ student: studentId });

    // ── FIX 3: Different canteen — warn the client instead of silently nuking
    //    the cart. The client (CartPage / MealListingPage) will show a confirm
    //    dialog.  If the request includes `{ confirmClear: true }` the server
    //    proceeds and clears the old items.
    if (cart && cart.canteen.toString() !== meal.canteen.toString()) {
      if (!req.body.confirmClear) {
        // Return a special status so the frontend can prompt the user
        return res.status(409).json({
          success: false,
          code: 'DIFFERENT_CANTEEN',
          message:
            'Your cart contains items from a different canteen. ' +
            'Clear the cart and add this item?',
        });
      }
      // User confirmed — clear old items
      cart.items = [];
      cart.canteen = meal.canteen;
      cart.totalAmount = 0;
    }

    if (!cart) {
      cart = new Cart({
        student: studentId,
        canteen: meal.canteen,
        items: [],
        totalAmount: 0,
      });
    }

    const existingItem = cart.items.find((item) => item.meal.toString() === mealId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
      if (!existingItem.price || existingItem.price === 0) {
        existingItem.price = mealPrice;
      }
    } else {
      cart.items.push({ meal: mealId, quantity: quantity || 1, price: mealPrice });
    }

    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await cart.save();

    // ── FIX 2: Always return a populated cart so item.meal is an object
    const populated = await populatedCart(studentId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/student/cart/update
// ─────────────────────────────────────────────────────────────────────────────
const updateCartItem = async (req, res) => {
  try {
    const { studentId, mealId, quantity } = req.body;

    const cart = await Cart.findOne({ student: studentId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find((i) => i.meal.toString() === mealId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    // Back-fill price if missing
    if (!item.price || item.price === 0) {
      const meal = await Meal.findById(mealId);
      if (meal) item.price = meal.basePrice || meal.price || 0;
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.meal.toString() !== mealId);
    } else {
      item.quantity = quantity;
    }

    cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    // ── FIX 2: Always return a populated cart
    const populated = await populatedCart(studentId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/student/cart/remove
// ─────────────────────────────────────────────────────────────────────────────
const removeFromCart = async (req, res) => {
  try {
    const { studentId, mealId } = req.body;

    const cart = await Cart.findOne({ student: studentId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.meal.toString() !== mealId);
    cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    // ── FIX 2: Always return a populated cart
    const populated = await populatedCart(studentId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/student/cart/clear/:studentId
// ─────────────────────────────────────────────────────────────────────────────
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ student: req.params.studentId });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
