const express = require('express');
const { User } = require('../models');

const router = express.Router();

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