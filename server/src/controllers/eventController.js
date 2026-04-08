const { Event, WishlistItem, Guest, RsvpResponse, Invitation } = require('../models');
const { generateShareCode } = require('../utils/generateCode');

const createEvent = async (req, res, next) => {
  try {
    const { title, event_type, description, event_date, venue } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event date are required.' });
    }

    let share_code;
    let isUnique = false;
    while (!isUnique) {
      share_code = generateShareCode();
      const existing = await Event.findOne({ where: { share_code } });
      if (!existing) isUnique = true;
    }

    const event = await Event.create({
      user_id: req.user.id,
      title,
      event_type: event_type || 'other',
      description,
      event_date,
      venue,
      share_code,
    });

    res.status(201).json({ message: 'Event created!', event });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: RsvpResponse, as: 'rsvpResponses', attributes: ['response', 'member_count'] },
        { model: Invitation, as: 'invitations', attributes: ['status'] },
      ],
      order: [['event_date', 'ASC']],
    });

    const eventsWithStats = events.map((event) => {
      const e = event.toJSON();
      const rsvps = e.rsvpResponses || [];
      e.rsvpStats = {
        yes: rsvps.filter((r) => r.response === 'yes').length,
        no: rsvps.filter((r) => r.response === 'no').length,
        maybe: rsvps.filter((r) => r.response === 'maybe').length,
        totalMembers: rsvps.filter((r) => r.response === 'yes').reduce((sum, r) => sum + r.member_count, 0),
      };
      e.inviteStats = {
        total: (e.invitations || []).length,
        sent: (e.invitations || []).filter((i) => i.status !== 'pending').length,
        responded: (e.invitations || []).filter((i) => i.status === 'responded').length,
      };
      delete e.rsvpResponses;
      delete e.invitations;
      return e;
    });

    res.json({ events: eventsWithStats });
  } catch (error) {
    next(error);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: WishlistItem, as: 'wishlistItems', include: [{ model: Guest, as: 'claimedBy', attributes: ['name'] }] },
        { model: RsvpResponse, as: 'rsvpResponses', include: [{ model: Guest, as: 'guest', attributes: ['name', 'phone'] }] },
        { model: Invitation, as: 'invitations' },
        { model: Guest, as: 'guests' },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const { title, event_type, description, event_date, venue, status } = req.body;
    await event.update({ title, event_type, description, event_date, venue, status });

    res.json({ message: 'Event updated!', event });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    await event.destroy();
    res.json({ message: 'Event deleted.' });
  } catch (error) {
    next(error);
  }
};

const getEventByShareCode = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { share_code: req.params.code },
      include: [
        { 
          model: WishlistItem, 
          as: 'wishlistItems',
          include: [{ model: Guest, as: 'claimedBy', attributes: ['name', 'access_token'] }],
        },
      ],
      attributes: { exclude: ['user_id'] },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent, getEventByShareCode };
