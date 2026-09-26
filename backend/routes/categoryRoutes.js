const express = require('express');
const categoryController = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Read endpoints
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Write endpoints (protected)
router.post('/', requireAuth, categoryController.create);
router.put('/:id', requireAuth, categoryController.update);
router.delete('/:id', requireAuth, requireRole('INVENTORY_MANAGER'), categoryController.delete);

module.exports = router;
