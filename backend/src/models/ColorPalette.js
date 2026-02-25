const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ColorPalette = sequelize.define('ColorPalette', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  primary_background: DataTypes.STRING,
  secondary_background: DataTypes.STRING,
  card_background: DataTypes.STRING,
  text_color: DataTypes.STRING,
  button_background: DataTypes.STRING,
  button_text_color: DataTypes.STRING,

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