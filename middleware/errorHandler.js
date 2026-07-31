function errorHandler(err, req, res, next) {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Something went wrong on our end.' : err.message,
    });
  }

  res.status(statusCode).render('500', {
    message: statusCode === 500 ? 'Something went wrong on our end.' : err.message,
  });
}

module.exports = errorHandler;