const jwt = require('jsonwebtoken');
const { PubOwner } = require('../models');

const partnerAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if this is a pub owner token
    if (decoded.type !== 'pub_owner') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const pubOwner = await PubOwner.findByPk(decoded.id);
    if (!pubOwner) {
      return res.status(401).json({ error: 'Pub owner not found' });
    }

    req.pubOwner = pubOwner;
    next();
  } catch (error) {
    console.error('Partner auth error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = partnerAuth;