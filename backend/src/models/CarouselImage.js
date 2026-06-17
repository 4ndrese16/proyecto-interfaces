const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CarouselImage = sequelize.define('CarouselImage', {
  image_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alt_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = CarouselImage;
