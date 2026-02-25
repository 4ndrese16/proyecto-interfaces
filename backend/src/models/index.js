const sequelize = require('../config/database');
const User = require('./User');
const ColorPalette = require('./ColorPalette');
const Typography = require('./Typography');

const initDB = async () => {
  await sequelize.sync({ alter: true });
};

module.exports = {
  sequelize,
  User,
  ColorPalette,
  Typography,
  initDB
};