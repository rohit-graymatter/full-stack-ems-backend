import { createClient } from 'redis';
import redisClient from './redisClient.js';
import dotenv from 'dotenv';
dotenv.config();

const subscriber = createClient({
  url: process.env.REDIS_URL,
  // No TLS options for plain TCP
});

subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

async function initSubscriber() {
  await subscriber.connect();
  console.log('✅ Redis subscriber connected');

  const handleMessage = async (message, channel) => {
    try {
      const data = JSON.parse(message);
      let action = '';
      if (channel === 'employee:add') action = 'New Employee Added';
      else if (channel === 'employee:update') action = 'Employee Updated';
      else if (channel === 'employee:delete') action = 'Employee Deleted';

      console.log(`📢 Admin notified: ${action} →`, data.name);

      // Save unified notification
      await redisClient.set(
        'latest:employee:notification',
        JSON.stringify({ ...data, type: channel }),
        { EX: 300 } // expire in 5 minutes
      );
    } catch (err) {
      console.error(`❌ Error parsing ${channel} message:`, err);
    }
  };

  await subscriber.subscribe('employee:add', (msg) => handleMessage(msg, 'employee:add'));
  await subscriber.subscribe('employee:update', (msg) => handleMessage(msg, 'employee:update'));
  await subscriber.subscribe('employee:delete', (msg) => handleMessage(msg, 'employee:delete'));
}

export { subscriber, initSubscriber };
