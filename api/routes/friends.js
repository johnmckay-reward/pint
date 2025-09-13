const express = require('express');
const { User, Friendship } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// POST /friends/requests - Send a friend request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user.id;

    // Basic validation
    if (!addresseeId) {
      return res.status(400).json({ error: 'Addressee ID is required' });
    }

    if (requesterId === addresseeId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if addressee exists
    const addressee = await User.findByPk(addresseeId);
    if (!addressee) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already sent' });
      } else if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ error: 'You are already friends' });
      }
    }

    // Create friend request
    const friendship = await Friendship.create({
      requesterId,
      addresseeId,
      status: 'pending'
    });

    // Return the friendship with user details
    const friendshipWithDetails = await Friendship.findByPk(friendship.id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      ]
    });

    res.status(201).json({
      message: 'Friend request sent successfully',
      friendship: friendshipWithDetails
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request', details: error.message });
  }
});

// PUT /friends/requests/:requestId - Accept or decline a friend request
router.put('/requests/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.user.id;

    // Validate action
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "accept" or "decline"' });
    }

    // Find the friendship request
    const friendship = await Friendship.findByPk(requestId, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Check if the current user is the addressee
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({ error: 'You can only respond to requests sent to you' });
    }

    // Check if request is still pending
    if (friendship.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been responded to' });
    }

    // Update the friendship status
    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    await friendship.save();

    res.json({
      message: `Friend request ${action}ed successfully`,
      friendship
    });

  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request', details: error.message });
  }
});

// GET /friends - Get list of accepted friends
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all accepted friendships where user is either requester or addressee
    const friendships = await Friendship.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { requesterId: userId },
              { addresseeId: userId }
            ]
          },
          { status: 'accepted' }
        ]
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'displayName', 'profilePictureUrl']
        }
      ]
    });

    // Extract the friend (the other user in each friendship)
    const friends = friendships.map(friendship => {
      if (friendship.requesterId === userId) {
        return friendship.addressee;
      } else {
        return friendship.requester;
      }
    });

    res.json({
      friends,
      count: friends.length
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends', details: error.message });
  }
});

// GET /friends/requests - Get pending friend requests (both sent and received)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get sent requests
    const sentRequests = await Friendship.findAll({
      where: {
        requesterId: userId,
        status: 'pending'
      },
      include: {
        model: User,
        as: 'addressee',
        attributes: ['id', 'displayName', 'profilePictureUrl']
      }
    });

    // Get received requests
    const receivedRequests = await Friendship.findAll({
      where: {
        addresseeId: userId,
        status: 'pending'
      },
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'displayName', 'profilePictureUrl']
      }
    });

    res.json({
      sentRequests,
      receivedRequests,
      counts: {
        sent: sentRequests.length,
        received: receivedRequests.length
      }
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests', details: error.message });
  }
});

module.exports = router;