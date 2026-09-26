const express = require('express');
const productController = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Read endpoints
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Write endpoints (protected)
router.post('/', requireAuth, productController.create);
router.put('/:id', requireAuth, productController.update);
router.delete('/:id', requireAuth, requireRole('INVENTORY_MANAGER'), productController.delete);

module.exports = router;
