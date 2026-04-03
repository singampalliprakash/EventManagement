const { Invitation, Event, Contact, Guest } = require('../models');
const { generateAccessToken } = require('../utils/generateCode');

const createInvitations = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const { contact_ids } = req.body;
    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return res.status(400).json({ error: 'At least one contact ID is required.' });
    }

    const contacts = await Contact.findAll({
      where: { id: contact_ids, user_id: req.user.id },
    });

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'No valid contacts found.' });
    }

    const results = [];

    for (const contact of contacts) {
      // Check if invitation already exists
      const existing = await Invitation.findOne({
        where: { event_id: event.id, contact_id: contact.id },
      });

      if (existing) {
        results.push({ contact_id: contact.id, status: 'already_exists', invitation: existing });
        continue;
      }

      // Create guest record for this contact
      const guest = await Guest.create({
        event_id: event.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        access_token: generateAccessToken(),
      });

      // Generate invite link
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const invite_link = `${clientUrl}/event/${event.share_code}?guest=${guest.access_token}`;

      // Create invitation
      const invitation = await Invitation.create({
        event_id: event.id,
        contact_id: contact.id,
        guest_id: guest.id,
        channel: 'whatsapp',
        invite_link,
      });

      results.push({ contact_id: contact.id, status: 'created', invitation });
    }

    res.status(201).json({ message: 'Invitations created!', results });
  } catch (error) {
    next(error);
  }
};

const getInvitations = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const invitations = await Invitation.findAll({
      where: { event_id: event.id },
      include: [
        { model: Contact, as: 'contact', attributes: ['name', 'phone', 'email', 'group_label'] },
        { model: Guest, as: 'guest', attributes: ['access_token'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ invitations });
  } catch (error) {
    next(error);
  }
};

const updateInvitationStatus = async (req, res, next) => {
  try {
    const invitation = await Invitation.findByPk(req.params.id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const { status } = req.body;
    if (!['pending', 'sent', 'opened', 'responded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await invitation.update({
      status,
      sent_at: status === 'sent' ? new Date() : invitation.sent_at,
    });

    res.json({ message: 'Invitation status updated!', invitation });
  } catch (error) {
    next(error);
  }
};

const getWhatsAppLink = async (req, res, next) => {
  try {
    const invitation = await Invitation.findByPk(req.params.inviteId, {
      include: [
        { model: Contact, as: 'contact' },
        { model: Guest, as: 'guest' },
      ],
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    const event = await Event.findByPk(invitation.event_id);

    const eventDate = new Date(event.event_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/event/${event.share_code}?guest=${invitation.guest.access_token}`;
    
    // One-Click RSVP Links
    const yesLink = `${clientUrl}/rsvp/quick?status=yes&guest=${invitation.guest.access_token}&event=${event.id}&code=${event.share_code}`;
    const noLink = `${clientUrl}/rsvp/quick?status=no&guest=${invitation.guest.access_token}&event=${event.id}&code=${event.share_code}`;

    const message = `🎉 *You're invited to ${event.title}!*

📅 *Date:* ${eventDate}
📍 *Venue:* ${event.venue || 'TBD'}

${event.description ? `📝 ${event.description}\n` : ''}
👉 *View details & wishlist:*
${inviteLink}

---
⚡ *Quick RSVP (Click to reply):*
✅ *I'm coming:* ${yesLink}
❌ *Can't make it:* ${noLink}

Please confirm your attendance! 🙏`;

    const phone = invitation.contact.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    res.json({ whatsappUrl, message });
  } catch (error) {
    next(error);
  }
};

module.exports = { createInvitations, getInvitations, updateInvitationStatus, getWhatsAppLink };
