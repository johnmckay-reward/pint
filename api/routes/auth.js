const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const emailService = require('../services/emailService');
const AchievementsService = require('../services/achievementsService');

const router = express.Router();

// POST /auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, favouriteTipple, profilePictureUrl, referralCode } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already in use.' });
    }

    // 2. Handle referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findOne({ where: { referralCode } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // 3. Create the new user (password is automatically hashed by the model hook)
    const user = await User.create({ 
      email, 
      password, 
      displayName, 
      favouriteTipple, 
      profilePictureUrl,
      referredById: referrerId
    });

    // 4. Award Pint Ambassador achievement to referrer if applicable
    if (referrerId) {
      AchievementsService.awardPintAmbassadorAchievement(referrerId).catch(error => {
        console.error('Failed to award referral achievement:', error);
      });
    }

    // 5. Generate a JWT for the new user
    const token = jwt.sign(
      { id: user.id }, // Payload
      process.env.JWT_SECRET, // Secret Key
      { expiresIn: '7d' } // Expires in 7 days
    );

    // 6. Send welcome email (async, don't wait for it)
    emailService.sendWelcomeEmail(user.email, user.displayName).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    // 7. Send the token and user info back
    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        favouriteTipple: user.favouriteTipple,
        profilePictureUrl: user.profilePictureUrl,
        referralCode: user.referralCode
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

// POST /auth/forgot-password - Request a password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether user exists or not for security
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate a password reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(user.email, resetToken);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed', details: error.message });
  }
});

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (jwtError) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find the user
    const user = await User.findByPk(decoded.id);
    if (!user || user.email !== decoded.email) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Hash the new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.status(200).json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed', details: error.message });
  }
});

module.exports = router;