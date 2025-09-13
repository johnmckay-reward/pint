const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PubOwner, Pub } = require('../models');

const router = express.Router();

// Register new pub owner
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName, contactName, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !businessName || !contactName) {
      return res.status(400).json({ 
        error: 'Email, password, business name, and contact name are required' 
      });
    }

    // Check if pub owner already exists
    const existingOwner = await PubOwner.findOne({ where: { email } });
    if (existingOwner) {
      return res.status(400).json({ error: 'Pub owner with this email already exists' });
    }

    // Create new pub owner
    const pubOwner = await PubOwner.create({
      email,
      password,
      businessName,
      contactName,
      phoneNumber
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: pubOwner.id, type: 'pub_owner' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      pubOwner: {
        id: pubOwner.id,
        email: pubOwner.email,
        businessName: pubOwner.businessName,
        contactName: pubOwner.contactName,
        phoneNumber: pubOwner.phoneNumber,
        isVerified: pubOwner.isVerified,
        pubId: pubOwner.pubId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login pub owner
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find pub owner
    const pubOwner = await PubOwner.findOne({ 
      where: { email },
      include: {
        model: Pub,
        as: 'pub'
      }
    });

    if (!pubOwner) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, pubOwner.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: pubOwner.id, type: 'pub_owner' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      pubOwner: {
        id: pubOwner.id,
        email: pubOwner.email,
        businessName: pubOwner.businessName,
        contactName: pubOwner.contactName,
        phoneNumber: pubOwner.phoneNumber,
        isVerified: pubOwner.isVerified,
        pubId: pubOwner.pubId,
        pub: pubOwner.pub
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;