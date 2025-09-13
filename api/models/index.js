const sequelize = require('../db');
const User = require('./user');
const PintSession = require('./pintSession');
const ChatMessage = require('./chatMessage');
const Friendship = require('./friendship');

// 1. One-to-Many Relationship: A User can initiate many sessions.
// This adds an `initiatorId` foreign key to the PintSession model.
User.hasMany(PintSession, {
  foreignKey: 'initiatorId'
});
PintSession.belongsTo(User, {
  as: 'initiator', // This allows us to include the initiator's data when we query a session.
  foreignKey: 'initiatorId'
});


// 2. Many-to-Many Relationship: A session has many attendees.
// Sequelize will automatically create a "junction table" called SessionAttendees
// to link users and the sessions they are attending.
User.belongsToMany(PintSession, { as: 'attendedSessions', through: 'SessionAttendees' });
PintSession.belongsToMany(User, { as: 'attendees', through: 'SessionAttendees' });


// 3. Chat Message Relationships
// A User can send many ChatMessages
User.hasMany(ChatMessage, {
  foreignKey: 'senderId',
  as: 'sentMessages'
});
ChatMessage.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// A PintSession can have many ChatMessages
PintSession.hasMany(ChatMessage, {
  foreignKey: 'sessionId',
  as: 'messages'
});
ChatMessage.belongsTo(PintSession, {
  foreignKey: 'sessionId',
  as: 'session'
});


// 4. Friendship Relationships
// A User can send many friend requests
User.hasMany(Friendship, {
  foreignKey: 'requesterId',
  as: 'sentRequests'
});
Friendship.belongsTo(User, {
  foreignKey: 'requesterId',
  as: 'requester'
});

// A User can receive many friend requests
User.hasMany(Friendship, {
  foreignKey: 'addresseeId',
  as: 'receivedRequests'
});
Friendship.belongsTo(User, {
  foreignKey: 'addresseeId',
  as: 'addressee'
});


// Export all models and the sequelize connection
module.exports = {
  sequelize,
  User,
  PintSession,
  ChatMessage,
  Friendship
};
