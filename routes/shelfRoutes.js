const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', shelfController.getShelves);
router.get('/:id', shelfController.getShelfById);

router.post('/', authenticate, requireRole('librarian'), shelfController.createShelf);
router.put('/:id', authenticate, requireRole('librarian'), shelfController.updateShelf);
router.delete('/:id', authenticate, requireRole('librarian'), shelfController.deleteShelf);

module.exports = router;