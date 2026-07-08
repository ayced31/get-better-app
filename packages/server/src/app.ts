import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import logRoutes from './routes/logs.js';
import leaderboardRoutes from './routes/leaderboard.js';
import userRoutes from './routes/users.js';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Allow localhost, 127.0.0.1, and private networks over http or https
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    
    // Automatically allow any Vercel deployments (production or previews)
    const isVercel = /\.vercel\.app$/.test(origin) || origin.endsWith('.vercel.app');
    
    // Normalize configured CORS_ORIGIN (remove trailing slashes, strip quotes) and support comma-separated list
    const cleanOriginEnv = (process.env.CORS_ORIGIN ?? '').replace(/^['"]|['"]$/g, '');
    const configuredOrigins = cleanOriginEnv
      ? cleanOriginEnv.split(',').map(o => o.trim().replace(/\/$/, ''))
      : [];

    if (isLocal || isVercel || configuredOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// ─── Health Check ────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
