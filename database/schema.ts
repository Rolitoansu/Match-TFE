import { 
  pgTable, 
  integer, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  primaryKey, 
  unique, 
  check,
  pgEnum 
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const matchStatusEnum = pgEnum('match_status', ['pending', 'accepted', 'rejected'])
export const tfgStatusEnum = pgEnum('tfg_status', ['proposed', 'in_progress', 'completed'])

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull(),
  surname: varchar('surname', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  registrationDate: timestamp('registration_date', { withTimezone: true, mode: 'date' })
    .defaultNow(),
  biography: text('biography'),
})

export const students = pgTable('students', {
  id: integer('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const professors = pgTable('professors', {
  id: integer('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  department: varchar('department', { length: 100 }).notNull(),
})

export const skills = pgTable('skills', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
})

export const studentSkills = pgTable('student_skills', {
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  skillId: integer('skill_id')
    .references(() => skills.id, { onDelete: 'cascade' })
    .notNull(),
  mark: integer('mark'),
}, (table) => [
  primaryKey({ columns: [table.studentId, table.skillId] }),
  check('mark_range', sql`${table.mark} >= 0 AND ${table.mark} <= 10`),
])

export const matches = pgTable('matches', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'cascade' }),
  professorId: integer('professor_id')
    .references(() => professors.id, { onDelete: 'cascade' }),
  status: matchStatusEnum('status').notNull(), 
  matchDate: timestamp('match_date', { withTimezone: true, mode: 'date' })
    .defaultNow(),
}, (table) => [
  unique().on(table.studentId, table.professorId),
])

export const chats = pgTable('chats', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'set null' }),
  professorId: integer('professor_id')
    .references(() => professors.id, { onDelete: 'set null' }),
  creationDate: timestamp('creation_date', { withTimezone: true, mode: 'date' })
    .defaultNow(),
}, (table) => [
  unique().on(table.studentId, table.professorId),
])

export const messages = pgTable('messages', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' })
    .defaultNow(),
  read: boolean('read').default(false),
  chatId: integer('chat_id')
    .references(() => chats.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id')
    .references(() => users.id, { onDelete: 'set null' }),
})

export const notifications = pgTable('notifications', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  type: varchar('type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' })
    .defaultNow(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const tfgs = pgTable('tfgs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: tfgStatusEnum('status').notNull(),
  publicationDate: timestamp('publication_date', { withTimezone: true, mode: 'date' })
    .defaultNow(),
  expirationDate: timestamp('expiration_date', { withTimezone: true, mode: 'date' }),
  tutorId: integer('tutor_id')
    .references(() => professors.id, { onDelete: 'set null' }),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'set null' }),
})

export const tags = pgTable('tags', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull().unique(),
})

export const tfgTags = pgTable('tfg_tags', {
  tfgId: integer('tfg_id')
    .references(() => tfgs.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
}, (table) => [
  primaryKey({ columns: [table.tfgId, table.tagId] }),
])

export const userTags = pgTable('user_tags', {
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, { onDelete: 'cascade' })
    .notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.tagId] }),
])