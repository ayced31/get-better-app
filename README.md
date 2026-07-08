# Get Better

A minimal, gamified daily activity and habit tracker built for a close circle of friends to build discipline and hold each other accountable.

## Key Features
- **Daily Logging**: Track physical activity, diet, study hours, and sleeping habits.
- **Rules & Penalties**: Base daily point caps (5-6 pts max), streaks, and consecutive missed-day penalties (-1 compounding).
- **Ranks & Leaderboard**: Level up your rank from *Plebeian* to *Invincible Moonlord* and watch the live competition leaderboard.
- **Aesthetic Dark UI**: Sleek, Linear-inspired dark mode UI.

## Tech Stack
- **Monorepo**: Managed with `pnpm` workspaces.
- **Frontend**: React + TypeScript + Vite + Zustand + TanStack Query.
- **Backend**: Node.js + Express + TypeScript + Drizzle ORM.
- **Database**: PostgreSQL (Neon Serverless).

## Quick Start
1. **Clone the Repo** and copy the environment variables:
   ```bash
   cp .env.example .env
   ```
   *(Fill in your PostgreSQL `DATABASE_URL` and `JWT_SECRET` in `.env`)*

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Database Setup**:
   ```bash
   pnpm --filter @get-better/server run db:push
   ```

4. **Run Development Mode**:
   ```bash
   pnpm dev
   ```
   *The frontend runs at `http://localhost:5173` and backend at `http://localhost:3001`.*
