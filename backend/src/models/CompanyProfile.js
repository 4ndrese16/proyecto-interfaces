const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyProfile = sequelize.define('CompanyProfile', {
  legal_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  fiscal_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  rif: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  }
});

module.exports = CompanyProfile;
