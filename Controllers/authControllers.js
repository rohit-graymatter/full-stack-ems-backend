import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../Models/userModel.js';
import redisClient from '../utils/redisClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const TOKEN_EXPIRY = 60 * 60 * 24; // 1 day in seconds

const MAX_ATTEMPTS = 3;
const LOCK_DURATION = 120; // in seconds

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    await redisClient.set(`session:${user._id}`, token, { EX: TOKEN_EXPIRY });
    await redisClient.incr('analytics:registers');

    res.status(201).json({ user: { id: user._id, name, email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const failKey = `login_fail:${email}`;

  try {
    // Check if user is currently locked out
    const attempts = await redisClient.get(failKey);

    if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
      const ttl = await redisClient.ttl(failKey);
      return res.status(429).json({
        message: `Too many failed attempts. Please try again after ${ttl} seconds.`,
        retryAfter: ttl
      });
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error(); // Treat as failed attempt

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error(); // Treat as failed attempt

    // ✅ Successful login — reset fail counter
    await redisClient.del(failKey);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    await redisClient.set(`session:${user._id}`, token, { EX: TOKEN_EXPIRY });
    await redisClient.incr('analytics:logins');

    return res.status(200).json({ user: { id: user._id, name: user.name, email }, token });

  } catch (err) {
    // On failed login — increment fail counter and set TTL
    await redisClient.incr(failKey);
    await redisClient.expire(failKey, LOCK_DURATION);

    const remaining = MAX_ATTEMPTS - (parseInt(await redisClient.get(failKey)) || 0);
    return res.status(401).json({
      message: `Invalid credentials.${remaining > 0 ? ` ${remaining} attempt(s) left.` : ''}`
    });
  }
};
