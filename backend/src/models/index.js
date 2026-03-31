const sequelize = require('../config/database');
const User = require('./User');
const ColorPalette = require('./ColorPalette');
const Typography = require('./Typography');
const Product = require('./Product');
const CompanyProfile = require('./CompanyProfile');
const PrinterProfile = require('./PrinterProfile');

const initDB = async () => {
  await sequelize.sync({ alter: true });
};

module.exports = {
  sequelize,
  User,
  ColorPalette,
  Typography,
  Product,
  CompanyProfile,
  PrinterProfile,
  initDB
};