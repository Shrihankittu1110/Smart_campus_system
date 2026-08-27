const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

// GET /api/student/cart/:studentId
router.get('/:studentId', getCart);

// POST /api/student/cart/add
router.post('/add', addToCart);

// PUT /api/student/cart/update
router.put('/update', updateCartItem);

// DELETE /api/student/cart/remove
router.delete('/remove', removeFromCart);

// DELETE /api/student/cart/clear/:studentId
router.delete('/clear/:studentId', clearCart);

module.exports = router;