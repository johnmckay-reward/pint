const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // 1. Get the token from the 'Authorization' header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  // 2. If no token is provided, deny access
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // 3. Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach the user's info (from the token) to the request object
    req.user = decoded;
    
    // 5. Pass control to the next function (the actual route handler)
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = authMiddleware;