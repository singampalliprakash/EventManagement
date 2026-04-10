const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  event_type: {
    type: DataTypes.ENUM('birthday', 'wedding', 'engagement', 'baby_shower', 'anniversary', 'housewarming', 'corporate', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  venue: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  custom_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  share_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'events',
});

module.exports = Event;
