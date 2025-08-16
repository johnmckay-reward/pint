const sequelize = require('../db');
const User = require('./user');
const PintSession = require('./pintSession');

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


// Export all models and the sequelize connection
module.exports = {
  sequelize,
  User,
  PintSession
};
