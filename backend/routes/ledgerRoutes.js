const express = require('express');
const ledgerController = require('../controllers/ledgerController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Read endpoints
router.get('/', requireAuth, ledgerController.getAll);
router.get('/:id', requireAuth, ledgerController.getById);

// Immutability enforcement: Block any direct modifications or deletions
const immutableBlocker = (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method Not Allowed: The stock ledger is immutable. Direct creation, modification, or deletion is strictly prohibited.',
  });
};

router.post('/', immutableBlocker);
router.put('/:id', immutableBlocker);
router.patch('/:id', immutableBlocker);
router.delete('/:id', immutableBlocker);

module.exports = router;
