const express = require('express');
const router = express.Router();
const readingLogController = require('../controllers/readingLogController');

router.post('/', readingLogController.createReadingLog);
router.get('/', readingLogController.getReadingLogs);
router.get('/:id', readingLogController.getReadingLogById);
router.put('/:id', readingLogController.updateReadingLog);
router.delete('/:id', readingLogController.deleteReadingLog);

module.exports = router;