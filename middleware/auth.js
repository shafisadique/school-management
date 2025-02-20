const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token

  console.log("Extracted Token:", token); // ✅ Debugging Log

  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  try {
    const SECRET_KEY = 'supersecretkey';  // Ensure this is the same everywhere
    const decoded = jwt.verify(token, SECRET_KEY);

    console.log("Decoded Token:", decoded); // ✅ Debugging Log

    req.user = decoded;  // Attach user info to request
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message); // ✅ Debugging Log
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
