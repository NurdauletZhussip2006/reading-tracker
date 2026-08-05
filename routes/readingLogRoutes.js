const express = require('express');
const router = express.Router();
const readingLogController = require('../controllers/readingLogController');
const authenticate = require('../middleware/auth');

router.get('/', readingLogController.getReadingLogs);
router.get('/mine', authenticate, readingLogController.getMyReadingLogs);
router.get('/export', authenticate, readingLogController.exportMyData);
router.get('/:id', readingLogController.getReadingLogById);

router.post('/', authenticate, readingLogController.createReadingLog);
router.put('/:id', authenticate, readingLogController.updateReadingLog);
router.delete('/:id', authenticate, readingLogController.deleteReadingLog);

module.exports = router;