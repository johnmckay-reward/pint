const express = require('express');
const { PintSession, User, ChatMessage, sequelize } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// POST /sessions - Create a new pint session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pubName, eta, location } = req.body;

    // Get the user ID from the JWT token instead of request body
    const initiatorId = req.user.id;

    // Create the session with appropriate location format
    const locationData = sequelize.getDialect() === 'postgres'
      ? { type: 'Point', coordinates: [location.lng, location.lat] } // PostGIS format
      : { lat: location.lat, lng: location.lng }; // Simple JSON for SQLite

    const newSession = await PintSession.create({
      pubName,
      eta,
      location: locationData,
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

    let sessions;
    
    if (sequelize.getDialect() === 'postgres') {
      // Use PostGIS for PostgreSQL
      const userLocation = sequelize.fn('ST_MakePoint', lng, lat);
      
      sessions = await PintSession.findAll({
        where: sequelize.where(
          sequelize.fn('ST_DWithin',
            sequelize.col('location'),
            userLocation,
            radius,
            true
          ),
          true
        ),
        include: {
          model: User,
          as: 'initiator',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      });
    } else {
      // For SQLite, return all sessions (simple fallback)
      sessions = await PintSession.findAll({
        include: {
          model: User,
          as: 'initiator',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      });
    }

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve nearby sessions', details: error.message });
  }
});

// GET /sessions - Get a list of all sessions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { pubName, date } = req.query;
    
    // Build where clause based on filters
    const whereClause = {};
    
    // Filter by pub name (case-insensitive partial match)
    if (pubName && pubName.trim()) {
      whereClause.pubName = {
        [Op.iLike]: `%${pubName.trim()}%`
      };
    }
    
    // Filter by date (sessions created on a specific date)
    if (date) {
      try {
        const filterDate = new Date(date);
        // Set to start of day (00:00:00)
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        // Set to end of day (23:59:59)
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        whereClause.createdAt = {
          [Op.between]: [startOfDay, endOfDay]
        };
      } catch (dateError) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD format.' });
      }
    }

    const sessions = await PintSession.findAll({
      where: whereClause,
      // "Eager load" the initiator's data along with each session
      include: {
        model: User,
        as: 'initiator',
        attributes: ['id', 'displayName', 'profilePictureUrl'] // Only include these fields
      },
      order: [['createdAt', 'DESC']] // Show newest first
    });
    
    res.json({
      sessions,
      count: sessions.length,
      filters: {
        pubName: pubName || null,
        date: date || null
      }
    });
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

// GET /sessions/:id/messages - Get chat messages for a session
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Verify the session exists
    const session = await PintSession.findByPk(sessionId, {
      include: {
        model: User,
        as: 'attendees',
        where: { id: userId },
        required: false
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is an attendee or the initiator
    const isAttendee = session.attendees?.some(attendee => attendee.id === userId);
    const isInitiator = session.initiatorId === userId;
    
    if (!isAttendee && !isInitiator) {
      return res.status(403).json({ error: 'You are not a member of this session' });
    }

    // Get messages with pagination (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const messages = await ChatMessage.findAll({
      where: { sessionId },
      include: {
        model: User,
        as: 'sender',
        attributes: ['id', 'displayName', 'profilePictureUrl']
      },
      order: [['createdAt', 'ASC']], // Oldest first for chat display
      limit,
      offset
    });

    res.json({
      messages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages', details: error.message });
  }
});


module.exports = router;