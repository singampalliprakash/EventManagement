const express = require('express');
const router = express.Router();
const { submitRsvp, getRsvpList, getRsvpStats, getRsvpPoll } = require('../controllers/rsvpController');
const { authenticate } = require('../middleware/auth');

// Public - guest submits RSVP
router.post('/events/:id/rsvp', submitRsvp);

// Public - anyone can see stats
router.get('/events/:id/rsvp/stats', getRsvpStats);

// Protected - host sees detailed list
router.get('/events/:id/rsvp', authenticate, getRsvpList);

// Protected - real-time polling for host dashboard
router.get('/events/:id/rsvp/poll', authenticate, getRsvpPoll);

module.exports = router;
