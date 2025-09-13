const express = require('express');
const { Op } = require('sequelize');
const { Pub, PintSession, User, PubOwner, sequelize } = require('../models');
const partnerAuth = require('../middleware/partnerAuth');

const router = express.Router();

// Search for pubs to claim
router.get('/pubs/search', partnerAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Use LIKE for SQLite, ILIKE for PostgreSQL
    const searchOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const searchTerm = `%${q}%`;

    const pubs = await Pub.findAll({
      where: {
        [Op.or]: [
          { name: { [searchOperator]: searchTerm } },
          { address: { [searchOperator]: searchTerm } }
        ]
      },
      include: {
        model: PubOwner,
        as: 'owner',
        required: false
      },
      limit: 20
    });

    // Only return pubs that don't have an owner yet
    const availablePubs = pubs.filter(pub => !pub.owner);

    res.json({
      pubs: availablePubs.map(pub => ({
        id: pub.id,
        name: pub.name,
        address: pub.address,
        description: pub.description,
        location: pub.location
      }))
    });

  } catch (error) {
    console.error('Pub search error:', error);
    res.status(500).json({ error: 'Server error during pub search' });
  }
});

// Claim a pub
router.post('/pubs/:id/claim', partnerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pubOwner = req.pubOwner;

    // Check if owner already has a pub
    if (pubOwner.pubId) {
      return res.status(400).json({ error: 'You have already claimed a pub' });
    }

    // Find the pub
    const pub = await Pub.findByPk(id, {
      include: {
        model: PubOwner,
        as: 'owner',
        required: false
      }
    });

    if (!pub) {
      return res.status(404).json({ error: 'Pub not found' });
    }

    if (pub.owner) {
      return res.status(400).json({ error: 'This pub is already claimed' });
    }

    // Claim the pub
    await pubOwner.update({ pubId: id });

    // Return updated pub owner with pub data
    const updatedOwner = await PubOwner.findByPk(pubOwner.id, {
      include: {
        model: Pub,
        as: 'pub'
      }
    });

    res.json({
      message: 'Pub claimed successfully',
      pubOwner: {
        id: updatedOwner.id,
        email: updatedOwner.email,
        businessName: updatedOwner.businessName,
        contactName: updatedOwner.contactName,
        phoneNumber: updatedOwner.phoneNumber,
        isVerified: updatedOwner.isVerified,
        pubId: updatedOwner.pubId,
        pub: updatedOwner.pub
      }
    });

  } catch (error) {
    console.error('Pub claim error:', error);
    res.status(500).json({ error: 'Server error during pub claim' });
  }
});

// Get my pub details
router.get('/my-pub', partnerAuth, async (req, res) => {
  try {
    const pubOwner = req.pubOwner;

    if (!pubOwner.pubId) {
      return res.status(404).json({ error: 'No pub claimed yet' });
    }

    const pub = await Pub.findByPk(pubOwner.pubId);
    if (!pub) {
      return res.status(404).json({ error: 'Pub not found' });
    }

    res.json({ pub });

  } catch (error) {
    console.error('Get pub error:', error);
    res.status(500).json({ error: 'Server error while fetching pub' });
  }
});

// Update my pub details
router.put('/my-pub', partnerAuth, async (req, res) => {
  try {
    const pubOwner = req.pubOwner;
    const { name, address, description, phoneNumber, openingHours, photoUrls } = req.body;

    if (!pubOwner.pubId) {
      return res.status(404).json({ error: 'No pub claimed yet' });
    }

    const pub = await Pub.findByPk(pubOwner.pubId);
    if (!pub) {
      return res.status(404).json({ error: 'Pub not found' });
    }

    // Update pub details
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (photoUrls !== undefined) updateData.photoUrls = photoUrls;

    await pub.update(updateData);

    res.json({
      message: 'Pub updated successfully',
      pub
    });

  } catch (error) {
    console.error('Update pub error:', error);
    res.status(500).json({ error: 'Server error while updating pub' });
  }
});

// Get sessions at my pub
router.get('/my-pub/sessions', partnerAuth, async (req, res) => {
  try {
    const pubOwner = req.pubOwner;

    if (!pubOwner.pubId) {
      return res.status(404).json({ error: 'No pub claimed yet' });
    }

    const sessions = await PintSession.findAll({
      where: { pubId: pubOwner.pubId },
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        },
        {
          model: User,
          as: 'attendees',
          attributes: ['id', 'displayName', 'profilePictureUrl'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Server error while fetching sessions' });
  }
});

// Get analytics for my pub
router.get('/my-pub/analytics', partnerAuth, async (req, res) => {
  try {
    const pubOwner = req.pubOwner;

    if (!pubOwner.pubId) {
      return res.status(404).json({ error: 'No pub claimed yet' });
    }

    // Get session count for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionCount = await PintSession.count({
      where: {
        pubId: pubOwner.pubId,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get total attendee count for last 30 days
    const sessions = await PintSession.findAll({
      where: {
        pubId: pubOwner.pubId,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      include: {
        model: User,
        as: 'attendees',
        attributes: ['id'],
        through: { attributes: [] }
      }
    });

    const attendeeCount = sessions.reduce((total, session) => {
      return total + session.attendees.length + 1; // +1 for initiator
    }, 0);

    // Get current week session count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklySessionCount = await PintSession.count({
      where: {
        pubId: pubOwner.pubId,
        createdAt: {
          [Op.gte]: oneWeekAgo
        }
      }
    });

    res.json({
      analytics: {
        sessionsThisMonth: sessionCount,
        attendeesThisMonth: attendeeCount,
        sessionsThisWeek: weeklySessionCount
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error while fetching analytics' });
  }
});

// Promote a session
router.post('/sessions/:id/promote', partnerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pubOwner = req.pubOwner;

    if (!pubOwner.pubId) {
      return res.status(404).json({ error: 'No pub claimed yet' });
    }

    // Find the session
    const session = await PintSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if session is at owner's pub
    if (session.pubId !== pubOwner.pubId) {
      return res.status(403).json({ error: 'You can only promote sessions at your own pub' });
    }

    // Promote the session
    await session.update({ isFeatured: true });

    res.json({
      message: 'Session promoted successfully',
      session
    });

  } catch (error) {
    console.error('Promote session error:', error);
    res.status(500).json({ error: 'Server error while promoting session' });
  }
});

module.exports = router;