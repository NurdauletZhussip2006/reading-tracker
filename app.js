
const express = require('express');
const path = require('path');
const readingRoutes = require('./routes/readingRoutes');
const apiRoutes = require('./routes/apiRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', readingRoutes);
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;