function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }

    if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }

  return obj;
}

function sanitizeInputs(req, res, next) {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
}

module.exports = sanitizeInputs;