const express = require('express');
const {
  createProcurement,
  getProcurements,
  syncProcurements,
  approvePayment,
  generateBankFile
} = require('../controllers/procurementController');
const { protect, authorize } = require('../middlewares/auth');
const router = express.Router();

router.get('/', protect, getProcurements);
router.post('/', protect, authorize('CENTER_OPERATOR'), createProcurement);
router.post('/sync', protect, authorize('CENTER_OPERATOR'), syncProcurements);

// Manager only — static routes BEFORE /:id parameterised routes
router.get('/export-bank-file', protect, authorize('OFFICE_MANAGER'), generateBankFile);
router.patch('/:id/approve', protect, authorize('OFFICE_MANAGER'), approvePayment);

module.exports = router;
