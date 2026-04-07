const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  discount_type: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false,
    defaultValue: 'percent'
  },
  discount_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  min_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
});

module.exports = Coupon;
