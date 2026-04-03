const { Contact } = require('../models');

const addContact = async (req, res, next) => {
  try {
    const { name, phone, email, group_label } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const existing = await Contact.findOne({ where: { user_id: req.user.id, phone } });
    if (existing) {
      return res.status(400).json({ error: 'A contact with this phone number already exists.' });
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

    if (phone && phone !== contact.phone) {
      const existing = await Contact.findOne({ where: { user_id: req.user.id, phone } });
      if (existing) {
        return res.status(400).json({ error: 'Another contact with this phone number already exists.' });
      }
    }

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

const bulkAddContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body; // Array of { name, phone, email, group_label }

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts array is required.' });
    }

    const results = { created: 0, skipped: 0 };
    
    // Get existing phone numbers for this user to check for duplicates
    const existingContacts = await Contact.findAll({
      where: { user_id: req.user.id },
      attributes: ['phone']
    });
    const existingPhones = new Set(existingContacts.map(c => c.phone));

    const contactsToCreate = [];
    for (const c of contacts) {
      if (!c.name || !c.phone) continue;
      
      // Clean phone number (some importers might include extra chars)
      const cleanPhone = c.phone.toString().replace(/[^0-9]/g, '');
      
      if (existingPhones.has(cleanPhone)) {
        results.skipped++;
        continue;
      }

      contactsToCreate.push({
        user_id: req.user.id,
        name: c.name,
        phone: cleanPhone,
        email: c.email || null,
        group_label: c.group_label || 'General'
      });
      
      // Add to set to prevent duplicates within the same bulk upload
      existingPhones.add(cleanPhone);
      results.created++;
    }

    if (contactsToCreate.length > 0) {
      await Contact.bulkCreate(contactsToCreate);
    }

    res.status(201).json({ 
      message: `Import complete! Added ${results.created} contacts, skipped ${results.skipped} duplicates.`,
      results 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addContact, getContacts, updateContact, deleteContact, bulkAddContacts };
