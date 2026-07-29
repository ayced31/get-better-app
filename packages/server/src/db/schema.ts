import { pgTable, uuid, varchar, integer, date, jsonb, boolean, timestamp, index, real } from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Activity Logs ───────────────────────────────────────────────

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    logDate: date('log_date').notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    activity: varchar('activity', { length: 100 }).notNull(),
    points: real('points').notNull(),
    rulesVersion: varchar('rules_version', { length: 20 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_logs_user_date').on(table.userId, table.logDate),
    index('idx_logs_user_category_date').on(table.userId, table.category, table.logDate),
    index('idx_logs_date').on(table.logDate),
  ]
);

// ─── Rules Versions ──────────────────────────────────────────────

export const rulesVersions = pgTable('rules_versions', {
  version: varchar('version', { length: 20 }).primaryKey(),
  rulesSnapshot: jsonb('rules_snapshot').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Retention Status ──────────────────────────────────────────────

export const retentionStatus = pgTable('retention_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  currentStreakStart: date('current_streak_start').notNull(),
  lastClaimedDays: integer('last_claimed_days').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
