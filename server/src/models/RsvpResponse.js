const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RsvpResponse = sequelize.define('RsvpResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'guests', key: 'id' },
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'events', key: 'id' },
  },
  response: {
    type: DataTypes.ENUM('yes', 'no', 'maybe'),
    allowNull: false,
  },
  member_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1, max: 50 },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'rsvp_responses',
});

module.exports = RsvpResponse;
