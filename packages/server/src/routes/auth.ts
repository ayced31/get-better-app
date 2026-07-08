import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { registerSchema, loginSchema } from '@get-better/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// ─── POST /register ──────────────────────────────────────────────

router.post('/register', validate(registerSchema), async (req, res) => {
  const { username, email, password, displayName } = req.body;

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));

  if (existing.length > 0) {
    const field = existing[0].username === username ? 'username' : 'email';
    res.status(409).json({ success: false, error: `This ${field} is already taken` });
    return;
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const createdUsers = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      displayName: displayName ?? username,
    })
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    });

  const user = createdUsers[0];
  if (!user) {
    res.status(500).json({ success: false, error: 'User creation failed' });
    return;
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
  );

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    },
  });
});

// ─── POST /login ─────────────────────────────────────────────────

router.post('/login', validate(loginSchema), async (req, res) => {
  const { identifier, password } = req.body;

  // Find user by username or email
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)));

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  // Compare password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      },
    },
  });
});

// ─── GET /me ─────────────────────────────────────────────────────

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, req.userId!));

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: { ...user, createdAt: user.createdAt.toISOString() },
  });
});

// ─── POST /reset-password ─────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400).json({ success: false, error: 'Email and new password are required' });
    return;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    // Return success anyway to avoid email enumeration
    res.json({ success: true, data: { message: 'If that email exists, the password has been updated.' } });
    return;
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  res.json({ success: true, data: { message: 'Password updated successfully.' } });
});

export default router;
