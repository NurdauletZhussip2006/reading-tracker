const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);

router.post('/', authenticate, requireRole('librarian'), bookController.createBook);
router.put('/:id', authenticate, requireRole('librarian'), bookController.updateBook);
router.delete('/:id', authenticate, requireRole('librarian'), bookController.deleteBook);

module.exports = router;