const express = require('express');
const adjustmentController = require('../controllers/adjustmentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, adjustmentController.getAll);
router.get('/:id', requireAuth, adjustmentController.getById);

router.post('/', requireAuth, adjustmentController.create);
router.put('/:id', requireAuth, adjustmentController.update);
router.post('/:id/apply', requireAuth, adjustmentController.apply);

module.exports = router;
