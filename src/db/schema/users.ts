import { relations } from "drizzle-orm";
import { bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { collaborations } from "./collaborations";

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    telegramUserId: bigint('telegram_user_id', {mode: 'number'}).notNull().unique(),
    telegramChatId: bigint('telegram_chat_id', {mode: 'number'}).notNull().unique(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    ownedProjects: many(projects),
    collaborations: many(collaborations),
}));


export type SelectUser = typeof users.$inferSelect;
  