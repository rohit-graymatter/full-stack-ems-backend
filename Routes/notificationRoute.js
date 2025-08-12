import { Router } from 'express';
import redisClient from '../utils/redisClient.js';

const notificationRouter = Router();

notificationRouter.get('/latest', async (req, res) => {
  try {
    const message = await redisClient.get('latest:employee:notification');

    if (!message) {
      return res.status(404).json({ message: 'No recent notifications' });
    }

    res.json({ notification: JSON.parse(message) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default notificationRouter;
