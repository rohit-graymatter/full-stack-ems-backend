import { Router } from 'express';
import redisClient from '../utils/redisClient.js';
import { protect } from '../Middleware/authMiddleware.js';

const statsRouter = Router();

statsRouter.get('/analytics', protect, async (req, res) => {
  try {
    const keys = [
      'analytics:logins',
      'analytics:registers',
      'analytics:getEmployees',
      'analytics:addEmployee',
      'analytics:updateEmployee',
      'analytics:deleteEmployee',
    ];

    const results = await Promise.all(keys.map(key => redisClient.get(key)));
    const data = {};
    keys.forEach((key, idx) => {
      data[key] = parseInt(results[idx] || '0');
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default statsRouter;
