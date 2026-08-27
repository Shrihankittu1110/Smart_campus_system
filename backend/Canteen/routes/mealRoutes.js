//backend/Canteen/routes/mealRoutes.js

const express = require('express');
const { upload, getMeals, addMeal, updateMeal, toggleAvailability, deleteMeal } = require('../controllers/mealController');
const { protect, authorize } = require('../../Auth/middleware/authMiddleware');

const router = express.Router();

router.get('/',                   protect, authorize('canteen'), getMeals);
router.post('/',                  protect, authorize('canteen'), upload.single('image'), addMeal);
router.put('/:id',                protect, authorize('canteen'), upload.single('image'), updateMeal);
router.patch('/:id/availability', protect, authorize('canteen'), toggleAvailability);
router.delete('/:id',             protect, authorize('canteen'), deleteMeal);

module.exports = router;