import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { collaborations } from './collaborations';

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    ownerId: uuid('owner_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    secretAccessKey: text('secret_access_key').notNull(),
    secretApiKey: text('secret_api_key').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
    owner: one(users, {
    fields: [projects.ownerId],
        references: [users.id],
    }),
    collaborators: many(collaborations),
}));

