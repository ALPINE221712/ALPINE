const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Low-stock alerts endpoint (placed before :productId/location routes to avoid parameter collision)
router.get('/low-stock', inventoryController.getLowStock);

// Specific balance lookups
router.get('/product/:productId', inventoryController.getByProduct);
router.get('/location/:locationId', inventoryController.getByLocation);

// Global inventory balance listing
router.get('/', inventoryController.getAll);

module.exports = router;
