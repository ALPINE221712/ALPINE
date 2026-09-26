const express = require('express');
const receiptController = require('../controllers/receiptController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', receiptController.getAll);
router.get('/:id', receiptController.getById);

router.post('/', requireAuth, receiptController.create);
router.put('/:id', requireAuth, receiptController.update);
router.post('/:id/validate', requireAuth, receiptController.validate);

module.exports = router;
