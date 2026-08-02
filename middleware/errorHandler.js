function errorHandler(err, req, res, next) {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? 'Something went wrong on our end.' : err.message;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} "${err.keyValue[field]}" already exists`;
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(statusCode).json({ error: message });
  }

  res.status(statusCode).render('500', { message });
}

module.exports = errorHandler;