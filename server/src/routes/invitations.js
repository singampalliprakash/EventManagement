const express = require('express');
const router = express.Router();
const { createInvitations, getInvitations, updateInvitationStatus, getWhatsAppLink } = require('../controllers/invitationController');
const { authenticate } = require('../middleware/auth');

router.post('/events/:id/invitations', authenticate, createInvitations);
router.get('/events/:id/invitations', authenticate, getInvitations);
router.put('/invitations/:id/status', authenticate, updateInvitationStatus);
router.get('/events/:id/invitations/whatsapp/:inviteId', authenticate, getWhatsAppLink);

module.exports = router;
