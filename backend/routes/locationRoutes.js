const express = require('express');
const locationController = require('../controllers/locationController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Read endpoints
router.get('/', locationController.getAll);
router.get('/:id', locationController.getById);

// Write endpoints (protected)
router.post('/', requireAuth, locationController.create);
router.put('/:id', requireAuth, locationController.update);
router.delete('/:id', requireAuth, requireRole('INVENTORY_MANAGER'), locationController.delete);

module.exports = router;
