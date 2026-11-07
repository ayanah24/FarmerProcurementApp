const express = require('express');
const { setPrice, getTodaysPrices, createCrop, getAllCrops } = require('../controllers/priceController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router.get('/today', protect, getTodaysPrices);
router.get('/crops', protect, getAllCrops);

// Manager only
router.post('/crops', protect, authorize('OFFICE_MANAGER'), createCrop);
router.post('/', protect, authorize('OFFICE_MANAGER'), setPrice);

module.exports = router;
