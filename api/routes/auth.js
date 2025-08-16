const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

// POST /auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, favouriteTipple, profilePictureUrl } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already in use.' });
    }

    // 2. Create the new user (password is automatically hashed by the model hook)
    const user = await User.create({ email, password, displayName, favouriteTipple, profilePictureUrl });

    // 3. Generate a JWT for the new user
    const token = jwt.sign(
      { id: user.id }, // Payload
      process.env.JWT_SECRET, // Secret Key
      { expiresIn: '7d' } // Expires in 7 days
    );

    // 4. Send the token and user info back
    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        favouriteTipple: user.favouriteTipple,
        profilePictureUrl: user.profilePictureUrl
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// POST /auth/login - Log a user in
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' }); // Generic error
    }

    // 2. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' }); // Generic error
    }

    // 3. If passwords match, generate a JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Send the token and user info back
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        favouriteTipple: user.favouriteTipple,
        profilePictureUrl: user.profilePictureUrl
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

module.exports = router;