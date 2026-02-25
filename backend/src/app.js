onst express = require('express');
const cors = require('cors');
const { initDB } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/colorPalettes', require('./routes/colorPalettesRoutes'));
app.use('/api/typography', require('./routes/typographyRoutes'));

initDB();

module.exports = app;