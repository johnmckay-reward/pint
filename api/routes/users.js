const express = require('express');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// GET /users/me - Get the current authenticated user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'displayName', 'email', 'favouriteTipple', 'profilePictureUrl']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile', details: error.message });
  }
});

// POST /users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { displayName, favouriteTipple, profilePictureUrl } = req.body;
    
    // Basic validation
    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required.' });
    }
    
    const newUser = await User.create({
      displayName,
      favouriteTipple,
      profilePictureUrl
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// GET /users/search?query=... - Search for users by display name
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    // Search for users by display name, excluding the current user
    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            displayName: {
              [Op.iLike]: `%${query.trim()}%` // Case-insensitive search
            }
          },
          {
            id: {
              [Op.ne]: currentUserId // Exclude current user
            }
          }
        ]
      },
      attributes: ['id', 'displayName', 'profilePictureUrl'],
      limit: 20, // Limit results to prevent large responses
      order: [['displayName', 'ASC']]
    });

    res.json({
      users,
      count: users.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users', details: error.message });
  }
});

// GET /users/:id - Get a user by their ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user', details: error.message });
  }
});

module.exports = router;