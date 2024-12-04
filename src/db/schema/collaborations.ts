import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { projects } from './projects';

export const collaborations = pgTable('collaborations', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.projectId] }),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  user: one(users, {
    fields: [collaborations.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [collaborations.projectId],
    references: [projects.id],
  }),
}));

