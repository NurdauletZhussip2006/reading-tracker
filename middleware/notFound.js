function notFound(req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: `No API endpoint at ${req.originalUrl}` });
  }
  res.status(404).render('404', { path: req.originalUrl });
}

module.exports = notFound;