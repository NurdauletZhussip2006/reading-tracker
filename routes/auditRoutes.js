const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/', authenticate, requireRole('librarian'), auditController.getAuditLog);

module.exports = router;