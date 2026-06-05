import { Request, Response } from 'express';
import { db } from '../database/db';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { User } from '../../shared/types';

// Mock JWT Signature Verification / Generation
export function generateMockToken(user: User, isRefresh = false): string {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Date.now() + (isRefresh ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60) // 7 days vs 1 hr
  };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock_signature_secret`;
}

export function decodeMockToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// In-memory Redis token blacklist simulation
const activeRefreshTokens = new Set<string>();

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      throw new AppError('Username, email, and password are required', 400);
    }

    const existingUser = db.users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      throw new AppError('User already exists with this email or username', 409);
    }

    const newUser: User = {
      id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
      username,
      email,
      role: role || 'citizen',
      passwordHash: `$2b$10$mockpasswordhash_${Date.now()}` // Simulate hashing
    };

    db.users.push(newUser);

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    // Simulate password validation
    const accessToken = generateMockToken(user);
    const refreshToken = generateMockToken(user, true);

    activeRefreshTokens.add(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || !activeRefreshTokens.has(refreshToken)) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const decoded = decodeMockToken(refreshToken);
    if (!decoded) {
      activeRefreshTokens.delete(refreshToken);
      throw new AppError('Refresh token expired, please log in again', 401);
    }

    const user = db.users.find(u => u.id === decoded.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newAccessToken = generateMockToken(user);
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      activeRefreshTokens.delete(refreshToken);
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  })
};
export { activeRefreshTokens };
