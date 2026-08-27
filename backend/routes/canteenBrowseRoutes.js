const express = require('express');
const router = express.Router();
const {
  getApprovedCanteens,
  getCanteenById,
  getMealsByCanteen,
  globalMealSearch,
  getMostOrderedMeals,
} = require('../controllers/canteenBrowseController');

// GET /api/student/canteens
router.get('/', getApprovedCanteens);

// GET /api/student/canteens/search?q=nasi&category=Rice&maxPrice=10
router.get('/search', globalMealSearch);

// GET /api/student/canteens/most-ordered/:studentId
router.get('/most-ordered/:studentId', getMostOrderedMeals);

// GET /api/student/canteens/:id
router.get('/:id', getCanteenById);

// GET /api/student/canteens/:canteenId/meals
router.get('/:canteenId/meals', getMealsByCanteen);

module.exports = router;
