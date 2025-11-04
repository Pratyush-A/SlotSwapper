const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if(!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch(err){
    console.error(err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;
