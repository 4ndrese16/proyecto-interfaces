const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ColorPalette = sequelize.define('ColorPalette', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  main_bg_background: DataTypes.STRING,
  secondary_background: DataTypes.STRING,
  accent_color: DataTypes.STRING,
  text_color: DataTypes.STRING,
  alternate_text_color: DataTypes.STRING,

  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = ColorPalette;