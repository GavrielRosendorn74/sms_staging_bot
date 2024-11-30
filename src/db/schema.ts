import { relations, sql } from 'drizzle-orm';
import { bigint, pgTable, text, timestamp, uuid, primaryKey, foreignKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).notNull().primaryKey(),
  telegramUserId: bigint('telegram_user_id', { mode: 'number' }).notNull(),
  telegramChatId: bigint('telegram_chat_id', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelation = relations(users, ({ many }) => ({
  projects: many(projects),
  usersToProjects: many(usersToProjects),
}));

export const projects = pgTable('projects', {
  id: uuid('id').default(sql`gen_random_uuid()`).notNull().primaryKey(),
  name: text('name', {}).notNull(),
  ownerId: uuid('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  fk: foreignKey({
    name: "owner_fk",
    columns: [table.ownerId],
    foreignColumns: [users.id],
  })
    .onDelete('cascade')
    .onUpdate('cascade')
}),)

export const projectsRelation = relations(projects, ({ many, one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
		references: [users.id],
  }),
  users: many(projects),
  usersToProjects: many(usersToProjects),
}));

export const usersToProjects = pgTable(
  'users_to_projects',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.projectId] }),
  }),
);

export const usersToProjectsRelations = relations(usersToProjects, ({ one }) => ({
  project: one(projects, {
    fields: [usersToProjects.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [usersToProjects.userId],
    references: [users.id],
  }),
}));