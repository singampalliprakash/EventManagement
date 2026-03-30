const express = require('express');
const router = express.Router();
const { addContact, getContacts, updateContact, deleteContact } = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, addContact);
router.get('/', authenticate, getContacts);
router.put('/:id', authenticate, updateContact);
router.delete('/:id', authenticate, deleteContact);

module.exports = router;
