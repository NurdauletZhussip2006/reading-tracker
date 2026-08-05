
const express = require('express');
const path = require('path');
const readingRoutes = require('./routes/readingRoutes');
const apiRoutes = require('./routes/apiRoutes');
const bookRoutes = require('./routes/bookRoutes');
const readingLogRoutes = require('./routes/readingLogRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const shelfRoutes = require('./routes/shelfRoutes');
const authRoutes = require('./routes/authRoutes');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitizeInputs = require('./middleware/sanitize');
const metricsRoutes = require('./routes/metricsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(sanitizeInputs);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/', readingRoutes);
app.use('/api', apiRoutes);
app.use('/api/library/books', bookRoutes);
app.use('/api/library/reading-logs', readingLogRoutes);
app.use('/api/library/reviews', reviewRoutes);
app.use('/api/library/shelves', shelfRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/library/metrics', metricsRoutes);
app.use('/api/library/audit-log', auditRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;