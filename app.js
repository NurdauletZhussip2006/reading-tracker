
const express = require('express');
const path = require('path');
const readingRoutes = require('./routes/readingRoutes');
const apiRoutes = require('./routes/apiRoutes');
const bookRoutes = require('./routes/bookRoutes');
const readingLogRoutes = require('./routes/readingLogRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const shelfRoutes = require('./routes/shelfRoutes');


const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', readingRoutes);
app.use('/api', apiRoutes);
app.use('/api/library/books', bookRoutes);
app.use('/api/library/reading-logs', readingLogRoutes);
app.use('/api/library/reviews', reviewRoutes);
app.use('/api/library/shelves', shelfRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;