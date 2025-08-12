import jwt from 'jsonwebtoken';
import redisClient from '../utils/redisClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const storedToken = await redisClient.get(`session:${decoded.id}`);

    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = { id: decoded.id }; // optionally attach more details here
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
