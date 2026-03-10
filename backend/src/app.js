const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/colorPalettes', require('./routes/colorPalettesRoutes'));
app.use('/api/typography', require('./routes/typographyRoutes'));

initDB();

module.exports = app;