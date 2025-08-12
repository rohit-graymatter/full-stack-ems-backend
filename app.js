import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import employeeRoute from './Routes/employeeRoute.js';
import { authRouter } from './Routes/authRoute.js';
import statsRouter from './Routes/statsRoute.js';
import notificationRouter from './Routes/notificationRoute.js'; // ✅ new import
import { rateLimiter } from './Middleware/rateLimitMiddleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Route-based Rate Limiting (Recommended)
app.use('/api/employees', rateLimiter());

// Routes
app.use('/api/auth', authRouter);              // Auth
app.use('/api/employees', employeeRoute);      // Employee CRUD
app.use('/api/stats', statsRouter);            // Analytics
app.use('/api/notifications', notificationRouter); // ✅ Notifications (new)

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running...' });
});

export default app;
