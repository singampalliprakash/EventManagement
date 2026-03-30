const { WishlistItem, Event, Guest } = require('../models');
const { detectPlatform } = require('../utils/platformDetector');

const addItem = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const { item_name, description, product_url, price, image_url } = req.body;
    if (!item_name) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    const platform = detectPlatform(product_url);

    const item = await WishlistItem.create({
      event_id: event.id,
      item_name,
      description,
      product_url,
      platform,
      price,
      image_url,
    });

    res.status(201).json({ message: 'Item added to wishlist!', item });
  } catch (error) {
    next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const items = await WishlistItem.findAll({
      where: { event_id: req.params.id },
      include: [{ model: Guest, as: 'claimedBy', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await WishlistItem.findByPk(req.params.itemId, {
      include: [{ model: Event, where: { user_id: req.user.id } }],
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const { item_name, description, product_url, price, image_url } = req.body;
    const platform = detectPlatform(product_url || item.product_url);

    await item.update({ item_name, description, product_url, platform, price, image_url });

    res.json({ message: 'Item updated!', item });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await WishlistItem.findByPk(req.params.itemId, {
      include: [{ model: Event, where: { user_id: req.user.id } }],
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    await item.destroy();
    res.json({ message: 'Item removed from wishlist.' });
  } catch (error) {
    next(error);
  }
};

const claimItem = async (req, res, next) => {
  try {
    const { guest_token } = req.body;
    if (!guest_token) {
      return res.status(400).json({ error: 'Guest token is required.' });
    }

    const guest = await Guest.findOne({ where: { access_token: guest_token } });
    if (!guest) {
      return res.status(404).json({ error: 'Invalid guest token.' });
    }

    const item = await WishlistItem.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.status === 'claimed' && item.claimed_by_guest_id !== guest.id) {
      return res.status(409).json({ error: 'This gift has already been claimed by someone else.' });
    }

    await item.update({
      claimed_by_guest_id: guest.id,
      status: 'claimed',
    });

    res.json({ message: 'Gift claimed successfully!', item });
  } catch (error) {
    next(error);
  }
};

const unclaimItem = async (req, res, next) => {
  try {
    const { guest_token } = req.body;
    const guest = await Guest.findOne({ where: { access_token: guest_token } });
    if (!guest) {
      return res.status(404).json({ error: 'Invalid guest token.' });
    }

    const item = await WishlistItem.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.claimed_by_guest_id !== guest.id) {
      return res.status(403).json({ error: 'You can only unclaim gifts you have claimed.' });
    }

    await item.update({
      claimed_by_guest_id: null,
      status: 'available',
    });

    res.json({ message: 'Gift unclaimed.', item });
  } catch (error) {
    next(error);
  }
};

module.exports = { addItem, getItems, updateItem, deleteItem, claimItem, unclaimItem };
