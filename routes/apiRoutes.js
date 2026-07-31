const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/books/search', apiController.searchBooks);
router.get('/books/best-sellers', apiController.getBestSellers);
router.get('/books/:id', apiController.getBookDetails);
router.get('/authors/search', apiController.searchAuthors);
router.get('/authors/bio', apiController.getAuthorBio);
router.get('/dictionary', apiController.lookupWord);
router.get('/libraries', apiController.findLibraries);
module.exports = router;