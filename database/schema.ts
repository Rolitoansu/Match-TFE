import { 
  pgTable, 
  integer, 
  varchar,
  text, 
  timestamp, 
  boolean, 
  primaryKey, 
  check,
  pgEnum 
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const matchStatusEnum = pgEnum('match_status', ['pending', 'accepted', 'rejected'])
export const projectStatusEnum = pgEnum('project_status', ['proposed', 'in_progress', 'completed'])

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull(),
  surname: varchar('surname', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  registrationDate: timestamp('registration_date', { withTimezone: true, mode: 'date' }).defaultNow(),
  biography: text('biography'),
  notificationFrequency: varchar('notification_frequency', { length: 20 }).notNull().default('disabled'),
  notificationReminderHour: integer('notification_reminder_hour').notNull().default(9),
  lastReminderEmailSentAt: timestamp('last_reminder_email_sent_at', { withTimezone: true, mode: 'date' }),
  role: varchar('role', { length: 20 }).notNull(),
})

export const administrators = pgTable('administrators', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull()
})

export const skills = pgTable('skills', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
})

export const userSkills = pgTable('user_skills', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  skillId: integer('skill_id').references(() => skills.id, { onDelete: 'cascade' }).notNull(),
  mark: integer('mark'),
}, (table) => [
  primaryKey({ columns: [table.userId, table.skillId] }),
  check('mark_range', sql`${table.mark} >= 0 AND ${table.mark} <= 10`),
])

export const matches = pgTable('matches', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  status: matchStatusEnum('status').notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.userId] }),
])

export const notifications = pgTable('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: varchar('type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).defaultNow(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
})

export const projects = pgTable('projects', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  tfeType: integer('tfe_type').notNull().default(6),
  status: projectStatusEnum('status').notNull().default('proposed'),
  publicationDate: timestamp('publication_date', { withTimezone: true, mode: 'date' }).defaultNow(),
  expirationDate: timestamp('expiration_date', { withTimezone: true, mode: 'date' }).default(sql`CURRENT_TIMESTAMP + INTERVAL '12 months'`),
  tutorId: integer('tutor_id').references(() => users.id, { onDelete: 'set null' }),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'set null' }),
}, (table) => [
  check('project_tfe_type_range', sql`${table.tfeType} >= 1 AND ${table.tfeType} <= 6`),
])

export const tags = pgTable('tags', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull().unique(),
})

export const projectTags = pgTable('project_tags', {
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.tagId] }),
])

export const userTags = pgTable('user_tags', {
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.tagId] }),
])