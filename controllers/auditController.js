const AuditLog = require('../models/AuditLog');

async function getAuditLog(req, res, next) {
  try {
    const logs = await AuditLog.find().populate('userId', 'email role').sort('-createdAt').limit(100);
    res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLog };