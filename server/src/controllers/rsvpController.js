const { RsvpResponse, Guest, Event } = require('../models');

const submitRsvp = async (req, res, next) => {
  try {
    const { guest_token, response, member_count, message } = req.body;

    if (!guest_token || !response) {
      return res.status(400).json({ error: 'Guest token and response are required.' });
    }

    if (!['yes', 'no', 'maybe'].includes(response)) {
      return res.status(400).json({ error: 'Response must be yes, no, or maybe.' });
    }

    const guest = await Guest.findOne({ where: { access_token: guest_token } });
    if (!guest) {
      return res.status(404).json({ error: 'Invalid guest token.' });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Upsert: update if already responded, create if new
    const [rsvp, created] = await RsvpResponse.findOrCreate({
      where: { guest_id: guest.id, event_id: event.id },
      defaults: {
        response,
        member_count: member_count || 1,
        message,
        responded_at: new Date(),
      },
    });

    if (!created) {
      await rsvp.update({
        response,
        member_count: member_count || 1,
        message,
        responded_at: new Date(),
      });
    }

    // Update invitation status to responded
    const { Invitation } = require('../models');
    await Invitation.update(
      { status: 'responded' },
      { where: { guest_id: guest.id, event_id: event.id } }
    );

    res.json({
      message: created ? 'RSVP submitted!' : 'RSVP updated!',
      rsvp,
    });
  } catch (error) {
    next(error);
  }
};

const getRsvpList = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const responses = await RsvpResponse.findAll({
      where: { event_id: event.id },
      include: [{ model: Guest, as: 'guest', attributes: ['name', 'phone', 'email'] }],
      order: [['responded_at', 'DESC']],
    });

    res.json({ responses });
  } catch (error) {
    next(error);
  }
};

const getRsvpStats = async (req, res, next) => {
  try {
    const responses = await RsvpResponse.findAll({
      where: { event_id: req.params.id },
    });

    const stats = {
      total: responses.length,
      yes: responses.filter((r) => r.response === 'yes').length,
      no: responses.filter((r) => r.response === 'no').length,
      maybe: responses.filter((r) => r.response === 'maybe').length,
      totalMembers: responses
        .filter((r) => r.response === 'yes')
        .reduce((sum, r) => sum + r.member_count, 0),
      maybeMembers: responses
        .filter((r) => r.response === 'maybe')
        .reduce((sum, r) => sum + r.member_count, 0),
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitRsvp, getRsvpList, getRsvpStats };
