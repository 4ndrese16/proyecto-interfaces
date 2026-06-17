const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Video = sequelize.define('Video', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Home Video'
    },
    video_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    audio1_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    audio2_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtitle1_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtitle2_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subtitle1_label: {
        type: DataTypes.STRING,
        defaultValue: 'Subtítulos 1'
    },
    subtitle2_label: {
        type: DataTypes.STRING,
        defaultValue: 'Subtítulos 2'
    },
    audio1_label: {
        type: DataTypes.STRING,
        defaultValue: 'Audio 1'
    },
    audio2_label: {
        type: DataTypes.STRING,
        defaultValue: 'Audio 2'
    }
}, {
    timestamps: true
});

module.exports = Video;