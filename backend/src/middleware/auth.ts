import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';

declare global {
  namespace Express {
    interface Request {
      user?: any; // Extend Request to include user
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token; // Get token from httpOnly cookie

  console.log('AuthMiddleware: Received token from cookie:', token ? 'Yes' : 'No');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided in cookie.' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('AuthMiddleware: Token validation failed:', error?.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
  }

  req.user = user;
  console.log('AuthMiddleware: User authenticated:', user.id);
  next();
};
