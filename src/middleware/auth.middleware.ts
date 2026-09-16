import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mikrotik_manager_secret_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role?: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Allow bypassing if configured or in local dev demo
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Check if development authorization header or token query is allowed
    const token = req.query.token as string | undefined;
    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { id: '1', username: 'admin', role: 'admin' };
        return next();
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing Authorization Bearer token',
      });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role?: string };
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Format must be Bearer <token>',
    });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role?: string };
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
}

export function generateToken(payload: { id: string; username: string; role?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
