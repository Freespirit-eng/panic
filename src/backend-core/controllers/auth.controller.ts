/**
 * Real JWT Authentication Controller — replaces mock token implementation.
 * Uses jsonwebtoken for signing/verification and bcryptjs for password hashing.
 */
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database/db';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { User } from '../../shared/types';

const JWT_SECRET          = process.env.JWT_SECRET          || 'panicsense_jwt_secret_change_in_production';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'panicsense_refresh_secret_change_in_production';
const ACCESS_TOKEN_TTL    = '1h';
const REFRESH_TOKEN_TTL   = '7d';

// In-memory refresh token allowlist (production: use Redis via BullMQ)
const activeRefreshTokens = new Set<string>();

// ─── Token helpers ────────────────────────────────────────────────────────────

export function generateAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function generateRefreshToken(user: User): string {
  return jwt.sign(
    { sub: user.id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * @deprecated Use verifyAccessToken — kept for socket.service.ts backward compat
 */
export function decodeMockToken(token: string): any {
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ─── Ensure seeded users have real bcrypt hashes on first boot ────────────────

let seededPasswordsHashed = false;

async function ensureSeededPasswords() {
  if (seededPasswordsHashed) return;
  seededPasswordsHashed = true;

  const DEFAULT_PASSWORDS: Record<string, string> = {
    'USR-001': 'operator123',
    'USR-002': 'commander123',
    'USR-003': 'admin@panicsense',
  };

  for (const user of db.users) {
    if (user.passwordHash === 'SEED_REPLACE_ON_FIRST_RUN') {
      const pw = DEFAULT_PASSWORDS[user.id] || 'panicsense123';
      user.passwordHash = await bcrypt.hash(pw, 12);
    }
  }
  db.save();
  console.log('[Auth] Seeded user passwords hashed with bcrypt.');
}

// Kick off on module load (non-blocking)
ensureSeededPasswords().catch(console.error);

// ─── Controller ───────────────────────────────────────────────────────────────

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      throw new AppError('Username, email, and password are required', 400);
    }

    const existing = db.users.find(u => u.email === email || u.username === username);
    if (existing) {
      throw new AppError('User already exists with this email or username', 409);
    }

    const allowedRoles = ['citizen', 'operator', 'commander', 'admin'];
    const assignedRole = allowedRoles.includes(role) ? role : 'citizen';

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser: User = {
      id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
      username,
      email,
      role: assignedRole,
      passwordHash,
    };

    db.users.push(newUser);
    db.save();

    res.status(201).json({
      success: true,
      data: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = db.users.find(u => u.email === email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Handle seeded placeholder hashes gracefully
    const isMatch =
      user.passwordHash === 'SEED_REPLACE_ON_FIRST_RUN'
        ? false
        : await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    activeRefreshTokens.add(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user:  { id: user.id, username: user.username, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken || !activeRefreshTokens.has(refreshToken)) {
      throw new AppError('Invalid or missing refresh token', 401);
    }

    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      activeRefreshTokens.delete(refreshToken);
      throw new AppError('Refresh token expired — please log in again', 401);
    }

    const user = db.users.find(u => u.id === decoded.sub);
    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({
      success: true,
      data: { accessToken: generateAccessToken(user) },
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) activeRefreshTokens.delete(refreshToken);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) throw new AppError('Not authenticated', 401);
    const found = db.users.find(u => u.id === user.sub);
    if (!found) throw new AppError('User not found', 404);
    res.status(200).json({
      success: true,
      data: { id: found.id, username: found.username, email: found.email, role: found.role },
    });
  }),
};

export { activeRefreshTokens };
