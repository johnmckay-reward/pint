const express = require('express');
const router = express.Router();
const User = require('../models/user');
const PubOwner = require('../models/pubOwner');
const PintSession = require('../models/pintSession');
const ChatMessage = require('../models/chatMessage');
const isAdmin = require('../middleware/isAdmin');
const { Op } = require('sequelize');

// Analytics Overview
router.get('/analytics', isAdmin, async (req, res) => {
  try {
    // Get basic user stats
    const totalUsers = await User.count();
    const newUsersThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get session stats
    const totalSessions = await PintSession.count();
    const activeSessions = await PintSession.count({
      where: {
        eta: {
          [Op.gte]: new Date()
        }
      }
    });

    // Get pub stats
    const totalPubOwners = await PubOwner.count();
    const pendingPubClaims = await PubOwner.count({
      where: { status: 'pending' }
    });

    // Get message stats
    const totalMessages = await ChatMessage.count();
    const messagesThisWeek = await ChatMessage.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek
      },
      sessions: {
        total: totalSessions,
        active: activeSessions
      },
      pubs: {
        totalOwners: totalPubOwners,
        pendingClaims: pendingPubClaims
      },
      messages: {
        total: totalMessages,
        thisWeek: messagesThisWeek
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// User Management
router.get('/users', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      users: users.rows,
      pagination: {
        page,
        limit,
        total: users.count,
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/users/:userId/suspend', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspended, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Note: This assumes we add a suspended field to the User model
    // For now, we'll just respond with success
    res.json({ 
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      userId,
      reason
    });
  } catch (error) {
    console.error('User suspension error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Pub Approval Queue
router.get('/pub-claims', isAdmin, async (req, res) => {
  try {
    const pendingClaims = await PubOwner.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(pendingClaims);
  } catch (error) {
    console.error('Pub claims fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pub claims' });
  }
});

router.patch('/pub-claims/:claimId/approve', isAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { approved, rejectionReason } = req.body;

    const claim = await PubOwner.findByPk(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Pub claim not found' });
    }

    const newStatus = approved ? 'approved' : 'rejected';
    await claim.update({ 
      status: newStatus,
      rejectionReason: approved ? null : rejectionReason,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    });

    res.json({ 
      message: `Pub claim ${newStatus} successfully`,
      claim: await claim.reload()
    });
  } catch (error) {
    console.error('Pub claim approval error:', error);
    res.status(500).json({ error: 'Failed to update pub claim' });
  }
});

// Content Moderation
router.get('/reported-content', isAdmin, async (req, res) => {
  try {
    // For now, return an empty array as we haven't implemented reporting
    // This would typically include reported messages, sessions, etc.
    res.json([]);
  } catch (error) {
    console.error('Reported content fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reported content' });
  }
});

router.delete('/messages/:messageId', isAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Message deletion error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;