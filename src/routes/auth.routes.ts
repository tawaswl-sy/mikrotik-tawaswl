import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateToken } from '../middleware/auth.middleware';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Generates JWT token for the backend API
 */
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const adminUser = process.env.APP_ADMIN_USER || 'admin';
    const adminPass = process.env.APP_ADMIN_PASS || 'admin123';

    // Validate credentials
    if (username === adminUser && password === adminPass) {
      const token = generateToken({ id: '1', username, role: 'admin' });
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: { id: '1', username, role: 'admin' },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation Error', details: err.issues });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
