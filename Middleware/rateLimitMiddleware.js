import redisClient from '../utils/redisClient.js';

export const rateLimiter = (limit = 600, windowInSeconds = 36) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip;
      const key = `rate:${ip}`;

      const current = await redisClient.get(key);

      if (current && parseInt(current) >= limit) {
        return res.status(429).json({ message: 'Too many requests. Try again later.' });
      }

      if (current) {
        await redisClient.incr(key);
      } else {
        await redisClient.set(key, 1, { EX: windowInSeconds });
      }

      next();
    } catch (err) {
      console.error('Rate Limiting Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
};
