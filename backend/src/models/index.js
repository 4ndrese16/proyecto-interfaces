const sequelize = require('../config/database');
const User = require('./User');
const ColorPalette = require('./ColorPalette');
const Typography = require('./Typography');
const Product = require('./Product');
const CompanyProfile = require('./CompanyProfile');
const PrinterProfile = require('./PrinterProfile');
const Coupon = require('./Coupon');
const PurchaseInvoice = require('./PurchaseInvoice');

User.hasMany(PurchaseInvoice, { foreignKey: 'user_id', as: 'invoices' });
PurchaseInvoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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
  Coupon,
  PurchaseInvoice,
  initDB
};