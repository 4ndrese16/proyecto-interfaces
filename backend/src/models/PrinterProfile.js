const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrinterProfile = sequelize.define('PrinterProfile', {
  company_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  rif: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  providence_code: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  providence_date: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  control_number: {
    // Se mantiene por compatibilidad, pero se calcula automaticamente desde control_range_start.
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  control_range_start: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  control_range_end: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  },
  control_assignment_date: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: ''
  }
});

module.exports = PrinterProfile;
