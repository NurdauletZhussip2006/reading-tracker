const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');

router.get('/', readingController.showHomePage);
router.post('/calculate-reading-plan', readingController.calculateReadingPlan);
router.get('/reading-tips', readingController.showReadingTips);
router.get('/search', readingController.showSearchPage);
router.get('/search/books', readingController.showBooksSearchPage);
router.get('/search/authors', readingController.showAuthorsSearchPage);
router.get('/search/dictionary', readingController.showDictionarySearchPage);
router.get('/search/libraries', readingController.showLibrariesSearchPage);
router.get('/search/best-sellers', readingController.showBestSellersPage);
router.get('/search/books/details', readingController.showBookDetailsPage);
router.get('/admin/books', readingController.showAdminBooksPage);
router.get('/admin/reading-logs', readingController.showAdminReadingLogsPage);


module.exports = router;