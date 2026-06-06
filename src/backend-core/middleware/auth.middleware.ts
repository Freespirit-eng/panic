/**
 * JWT Authentication & RBAC Middleware
 *
 * authenticate    — verifies Bearer token, attaches req.user
 * requireRole     — RBAC guard factory, pass allowed roles array
 * optionalAuth    — attaches user if token present but doesn't block
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../controllers/auth.controller';
import { AppError } from './error.middleware';

export type UserRole = 'citizen' | 'operator' | 'commander' | 'admin';

// ─── authenticate ─────────────────────────────────────────────────────────────

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('Authentication required — provide Bearer token', 401));
    return;
  }

  const token = header.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError('Access token expired — please refresh', 401));
    } else {
      next(new AppError('Invalid access token', 401));
    }
  }
}

// ─── requireRole ──────────────────────────────────────────────────────────────

/**
 * Role-based access control guard.
 * Usage: router.post('/missions', authenticate, requireRole(['operator', 'commander', 'admin']), handler)
 */
export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!roles.includes(user.role as UserRole)) {
      next(new AppError(`Access denied — required role: ${roles.join(' | ')}`, 403));
      return;
    }
    next();
  };
}

// ─── optionalAuth ─────────────────────────────────────────────────────────────

/** Attaches user to req if token is present and valid — never blocks the request. */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      (req as any).user = verifyAccessToken(header.split(' ')[1]);
    } catch { /* ignore */ }
  }
  next();
}
