const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseInvoice = sequelize.define('PurchaseInvoice', {
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  control_number: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  taxable_base: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  vat_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'BOB'
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  payment_plan: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  payment_parts: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  coupon: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  issuer_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  buyer_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  printer_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'paid'
  }
});

module.exports = PurchaseInvoice;
