const express = require('express');
const { PintSession, User } = require('../models');

const router = express.Router();

// POST /sessions - Create a new pint session
router.post('/', async (req, res) => {
  try {
    const { pubName, eta, location, initiatorId } = req.body;

    // Create the session
    const newSession = await PintSession.create({
      pubName,
      eta,
      // Location data should be a GeoJSON Point
      location: { type: 'Point', coordinates: [location.lng, location.lat] },
      initiatorId
    });

    // Automatically add the initiator as the first attendee
    await newSession.addAttendee(initiatorId);

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

// GET /sessions - Get a list of all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await PintSession.findAll({
      // "Eager load" the initiator's data along with each session
      include: {
        model: User,
        as: 'initiator',
        attributes: ['id', 'displayName', 'profilePictureUrl'] // Only include these fields
      },
      order: [['createdAt', 'DESC']] // Show newest first
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions', details: error.message });
  }
});

// GET /sessions/:id - Get details for a single session
router.get('/:id', async (req, res) => {
    try {
        const session = await PintSession.findByPk(req.params.id, {
            // Include both the initiator and all attendees
            include: [
                { model: User, as: 'initiator', attributes: ['id', 'displayName', 'profilePictureUrl'] },
                { 
                    model: User, 
                    as: 'attendees',
                    attributes: ['id', 'displayName', 'profilePictureUrl'],
                    through: { attributes: [] } // Don't include the junction table data
                }
            ]
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve session', details: error.message });
    }
});


// POST /sessions/:id/attendees - Join a session
router.post('/:id/attendees', async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await PintSession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // `addAttendee` is a special method Sequelize creates for us
    await session.addAttendee(userId);
    res.status(200).json({ message: 'Successfully joined session!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join session', details: error.message });
  }
});


module.exports = router;