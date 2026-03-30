const { Contact } = require('../models');

const addContact = async (req, res, next) => {
  try {
    const { name, phone, email, group_label } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const contact = await Contact.create({
      user_id: req.user.id,
      name,
      phone,
      email,
      group_label,
    });

    res.status(201).json({ message: 'Contact added!', contact });
  } catch (error) {
    next(error);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']],
    });

    res.json({ contacts });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const { name, phone, email, group_label } = req.body;
    await contact.update({ name, phone, email, group_label });

    res.json({ message: 'Contact updated!', contact });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    await contact.destroy();
    res.json({ message: 'Contact deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addContact, getContacts, updateContact, deleteContact };
