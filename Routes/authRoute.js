import { Router } from 'express';
import { registerUser, loginUser } from '../Controllers/authControllers.js';

export const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
