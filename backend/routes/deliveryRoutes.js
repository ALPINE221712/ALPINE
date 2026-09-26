const express = require('express');
const deliveryController = require('../controllers/deliveryController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, deliveryController.getAll);
router.get('/:id', requireAuth, deliveryController.getById);

router.post('/', requireAuth, deliveryController.create);
router.put('/:id', requireAuth, deliveryController.update);
router.post('/:id/pick', requireAuth, deliveryController.pick);
router.post('/:id/pack', requireAuth, deliveryController.pack);
router.post('/:id/validate', requireAuth, deliveryController.validate);

module.exports = router;
