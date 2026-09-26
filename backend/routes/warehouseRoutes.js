const express = require('express');
const warehouseController = require('../controllers/warehouseController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Read endpoints
router.get('/', warehouseController.getAll);
router.get('/:id', warehouseController.getById);

// Write endpoints (protected)
router.post('/', requireAuth, warehouseController.create);
router.put('/:id', requireAuth, warehouseController.update);
router.delete('/:id', requireAuth, requireRole('INVENTORY_MANAGER'), warehouseController.delete);

module.exports = router;
