const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEvent, updateEvent, deleteEvent, getEventByShareCode } = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

// Public route - guest access via share code
router.get('/share/:code', getEventByShareCode);

// Protected routes
router.post('/', authenticate, createEvent);
router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

module.exports = router;
