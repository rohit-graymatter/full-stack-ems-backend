import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

console.log('Using Redis URL:', process.env.REDIS_URL);

const redisClient = createClient({
  url: process.env.REDIS_URL,
  // No TLS options for plain TCP
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('✅ Redis client connected');
  }
};

export default redisClient;
