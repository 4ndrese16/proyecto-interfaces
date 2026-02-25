const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Typography = sequelize.define('Typography', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  font_family: DataTypes.STRING,
  font_file_path: DataTypes.STRING,

  h1_size: DataTypes.STRING,
  h2_size: DataTypes.STRING,
  p_size: DataTypes.STRING,

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = TypographySettings;