import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/adminTypes';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.admin?.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
    return;
  }
  next();
};

// Generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Cookie options
export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true, 
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
};

// Backward compatibility
export const cookieOptions = getCookieOptions();