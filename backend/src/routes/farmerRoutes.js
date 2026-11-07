const express = require('express');
const { registerFarmer, getAllFarmers, verifyFarmer } = require('../controllers/farmerController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router.post('/', protect, registerFarmer);
router.get('/', protect, getAllFarmers);
router.patch('/:id/verify', protect, authorize('OFFICE_MANAGER'), verifyFarmer);

module.exports = router;
