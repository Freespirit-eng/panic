import { Request, Response, NextFunction } from 'express';
import { decodeMockToken } from '../controllers/auth.controller';
import { AppError } from './error.middleware';

/**
 * Middleware boundary to verify JWT tokens from Request Authorization headers.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required', 401));
  }

  const token = authHeader.split(' ')[1];
  const decodedPayload = decodeMockToken(token);

  if (!decodedPayload) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }

  // Bind decoded claims to request context securely
  (req as any).user = {
    id: decodedPayload.sub,
    username: decodedPayload.username,
    email: decodedPayload.email,
    role: decodedPayload.role
  };

  next();
};

/**
 * Middleware boundary to verify that the logged-in user possesses the required clearance roles.
 */
export const requireRole = (allowedRoles: ('citizen' | 'volunteer' | 'operator' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      return next(new AppError('Authentication context missing', 401));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError(`Access forbidden: requires one of the roles [${allowedRoles.join(', ')}]`, 403));
    }

    next();
  };
};
