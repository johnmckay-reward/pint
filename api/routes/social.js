const express = require('express');
const { PintSession, User } = require('../models');

const router = express.Router();

// GET /social/session/:id/preview - Generate social media preview for a pint session
router.get('/session/:id/preview', async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Find the session with initiator details
    const session = await PintSession.findByPk(sessionId, {
      include: {
        model: User,
        as: 'initiator',
        attributes: ['displayName']
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Format the date/time
    const eta = new Date(session.eta);
    const formattedDate = eta.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const formattedTime = eta.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    // Generate SVG preview image
    const svgContent = generateSessionPreviewSVG({
      pubName: session.pubName,
      initiatorName: session.initiator.displayName,
      date: formattedDate,
      time: formattedTime,
      sessionId: sessionId
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(svgContent);

  } catch (error) {
    console.error('Error generating session preview:', error);
    res.status(500).json({ error: 'Failed to generate preview', details: error.message });
  }
});

function generateSessionPreviewSVG({ pubName, initiatorName, date, time, sessionId }) {
  // Truncate long names to fit in the image
  const truncatedPubName = pubName.length > 30 ? pubName.substring(0, 30) + '...' : pubName;
  const truncatedInitiatorName = initiatorName.length > 20 ? initiatorName.substring(0, 20) + '...' : initiatorName;

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#eaa221;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f4f1de;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)" />
      
      <!-- Content area -->
      <rect x="60" y="60" width="1080" height="510" fill="white" rx="20" opacity="0.95" />
      
      <!-- Beer emoji -->
      <text x="120" y="180" font-size="80" font-family="serif">🍺</text>
      
      <!-- Main title -->
      <text x="250" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#4a2c2a">Join me for a pint!</text>
      
      <!-- Pub name -->
      <text x="250" y="210" font-family="Arial, sans-serif" font-size="36" fill="#4a2c2a">${escapeXml(truncatedPubName)}</text>
      
      <!-- Date and time -->
      <text x="250" y="270" font-family="Arial, sans-serif" font-size="28" fill="#5c413f">${date} at ${time}</text>
      
      <!-- Hosted by -->
      <text x="250" y="320" font-family="Arial, sans-serif" font-size="24" fill="#5c413f">Hosted by ${escapeXml(truncatedInitiatorName)}</text>
      
      <!-- App branding -->
      <text x="250" y="420" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#eaa221">Pint?</text>
      <text x="250" y="450" font-family="Arial, sans-serif" font-size="20" fill="#5c413f">Meet new people at pubs</text>
      
      <!-- QR-like decoration -->
      <rect x="900" y="350" width="200" height="200" fill="#4a2c2a" rx="10" opacity="0.1" />
      <text x="1000" y="460" font-family="Arial, sans-serif" font-size="16" fill="#4a2c2a" text-anchor="middle">Session ${sessionId.substring(0, 8)}</text>
    </svg>
  `;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = router;