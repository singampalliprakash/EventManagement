const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WishlistItem = sequelize.define('WishlistItem', {
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
  item_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  product_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  platform: {
    type: DataTypes.ENUM('amazon', 'flipkart', 'meesho', 'myntra', 'other'),
    allowNull: true,
    defaultValue: 'other',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  claimed_by_guest_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'guests', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('available', 'claimed', 'purchased'),
    allowNull: false,
    defaultValue: 'available',
  },
}, {
  tableName: 'wishlist_items',
});

module.exports = WishlistItem;
