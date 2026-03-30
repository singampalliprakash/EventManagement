const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const WishlistItem = require('./WishlistItem');
const Contact = require('./Contact');
const Guest = require('./Guest');
const RsvpResponse = require('./RsvpResponse');
const Invitation = require('./Invitation');

// User <-> Event
User.hasMany(Event, { foreignKey: 'user_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'user_id', as: 'host' });

// User <-> Contact
User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
Contact.belongsTo(User, { foreignKey: 'user_id' });

// Event <-> WishlistItem
Event.hasMany(WishlistItem, { foreignKey: 'event_id', as: 'wishlistItems' });
WishlistItem.belongsTo(Event, { foreignKey: 'event_id' });

// Event <-> Guest
Event.hasMany(Guest, { foreignKey: 'event_id', as: 'guests' });
Guest.belongsTo(Event, { foreignKey: 'event_id' });

// Guest <-> WishlistItem (claim)
Guest.hasMany(WishlistItem, { foreignKey: 'claimed_by_guest_id', as: 'claimedItems' });
WishlistItem.belongsTo(Guest, { foreignKey: 'claimed_by_guest_id', as: 'claimedBy' });

// Guest <-> RsvpResponse
Guest.hasOne(RsvpResponse, { foreignKey: 'guest_id', as: 'rsvp' });
RsvpResponse.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });

// Event <-> RsvpResponse
Event.hasMany(RsvpResponse, { foreignKey: 'event_id', as: 'rsvpResponses' });
RsvpResponse.belongsTo(Event, { foreignKey: 'event_id' });

// Event <-> Invitation
Event.hasMany(Invitation, { foreignKey: 'event_id', as: 'invitations' });
Invitation.belongsTo(Event, { foreignKey: 'event_id' });

// Contact <-> Invitation
Contact.hasMany(Invitation, { foreignKey: 'contact_id', as: 'invitations' });
Invitation.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

// Guest <-> Invitation
Guest.hasOne(Invitation, { foreignKey: 'guest_id', as: 'invitation' });
Invitation.belongsTo(Guest, { foreignKey: 'guest_id', as: 'guest' });

module.exports = {
  sequelize,
  User,
  Event,
  WishlistItem,
  Contact,
  Guest,
  RsvpResponse,
  Invitation,
};
