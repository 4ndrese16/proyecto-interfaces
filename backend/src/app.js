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
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/company-profile', require('./routes/companyProfileRoutes'));
app.use('/api/printer-profile', require('./routes/printerProfileRoutes'));

initDB();

module.exports = app;