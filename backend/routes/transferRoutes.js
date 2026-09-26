const express = require('express');
const transferController = require('../controllers/transferController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, transferController.getAll);
router.get('/:id', requireAuth, transferController.getById);

router.post('/', requireAuth, transferController.create);
router.put('/:id', requireAuth, transferController.update);
router.post('/:id/validate', requireAuth, transferController.validate);

module.exports = router;
