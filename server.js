require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/constants');

connectDB();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});