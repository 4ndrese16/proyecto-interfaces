const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  fiscal_address: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  document_id: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  tax_id: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'customer'
  }
});

module.exports = User;