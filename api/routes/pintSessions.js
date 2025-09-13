const express = require('express');
const { PintSession, User, sequelize } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /sessions - Create a new pint session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pubName, eta, location } = req.body;

    // Get the user ID from the JWT token instead of request body
    const initiatorId = req.user.id;

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

    // Return the session with the initiator info
    const sessionWithInitiator = await PintSession.findByPk(newSession.id, {
      include: {
        model: User,
        as: 'initiator',
        attributes: ['id', 'displayName', 'profilePictureUrl']
      }
    });

    res.status(201).json(sessionWithInitiator);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

// GET /sessions/nearby?lat=...&lng=...&radius=...
// Find all sessions within a given radius of a location.
// NOTE: Place this route BEFORE the '/:id' route.
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; // Radius is in meters

    if (!lat || !lng || !radius) {
      return res.status(400).json({ error: 'Latitude, longitude, and radius are required.' });
    }

    // The user's location, created as a geographic point
    const userLocation = sequelize.fn('ST_MakePoint', lng, lat);
    
    const sessions = await PintSession.findAll({
      where: sequelize.where(
        // ST_DWithin is a PostGIS function that checks if a session's location
        // is within a certain distance (in meters) of the user's location.
        sequelize.fn('ST_DWithin',
          sequelize.col('location'), // The 'location' column of the PintSession table
          userLocation,
          radius,
          true // use spheroid, for more accurate distance calc
        ),
        true
      ),
      include: {
        model: User,
        as: 'initiator',
        attributes: ['id', 'displayName', 'profilePictureUrl']
      }
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve nearby sessions', details: error.message });
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


// POST /sessions/:id/join - Join a session (simplified endpoint)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const session = await PintSession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get the user ID from the JWT token
    const userId = req.user.id;

    // Check if user is already an attendee
    const existingAttendee = await session.hasAttendee(userId);
    if (existingAttendee) {
      return res.status(400).json({ error: 'You are already attending this session' });
    }

    // Add user as attendee
    await session.addAttendee(userId);
    res.status(200).json({ message: 'Successfully joined session!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join session', details: error.message });
  }
});

// POST /sessions/:id/attendees - Join a session (legacy endpoint)
router.post('/:id/attendees', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await PintSession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Use userId from body if provided, otherwise use from JWT token
    const attendeeId = userId || req.user.id;

    // `addAttendee` is a special method Sequelize creates for us
    await session.addAttendee(attendeeId);
    res.status(200).json({ message: 'Successfully joined session!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join session', details: error.message });
  }
});


module.exports = router;