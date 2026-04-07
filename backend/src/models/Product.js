const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
	product_code: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: ''
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: false
	},
	price: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: false,
		validate: {
			min: 0
		}
	},
	category: {
		type: DataTypes.ENUM('telefono', 'accesorio'),
		allowNull: false
	},
	brand: {
		type: DataTypes.STRING,
		allowNull: false
	},
	is_new: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	has_discount: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	},
	discount_percentage: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		validate: {
			min: 0,
			max: 99
		}
	},
	main_image_path: {
		type: DataTypes.STRING,
		allowNull: true
	},
	variants: {
		type: DataTypes.JSONB,
		allowNull: false,
		defaultValue: []
	},
	is_active: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
});

module.exports = Product;
