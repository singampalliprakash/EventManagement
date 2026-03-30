const express = require('express');
const router = express.Router();
const { submitRsvp, getRsvpList, getRsvpStats } = require('../controllers/rsvpController');
const { authenticate } = require('../middleware/auth');

// Public - guest submits RSVP
router.post('/events/:id/rsvp', submitRsvp);

// Public - anyone can see stats
router.get('/events/:id/rsvp/stats', getRsvpStats);

// Protected - host sees detailed list
router.get('/events/:id/rsvp', authenticate, getRsvpList);

module.exports = router;
