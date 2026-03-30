const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'events', key: 'id' },
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'contacts', key: 'id' },
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'guests', key: 'id' },
  },
  channel: {
    type: DataTypes.ENUM('whatsapp', 'email', 'sms'),
    allowNull: false,
    defaultValue: 'whatsapp',
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'opened', 'responded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  invite_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'invitations',
});

module.exports = Invitation;
