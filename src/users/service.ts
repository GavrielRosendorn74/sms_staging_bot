import { eq } from "drizzle-orm";
import db from "../db";
import { users } from "../db/schema/users";
import { projects } from "../db/schema/projects";
import { collaborations } from "../db/schema/collaborations";
import { Env } from "..";

export const userService = (env: Env) => ({
    async createUser({
        telegramUserId,
        telegramChatId,
        name
    }: {
        telegramUserId: number,
        telegramChatId: number,
        name: string
    }) {
      const [user] = await db(env.DATABASE_URL)
        .insert(users)
        .values({ telegramChatId, telegramUserId, name })
        .returning();
      return user;
    },
  

    async getUserById(userId: string) {
        const user = await db(env.DATABASE_URL)
                .query
                .users
                .findFirst({
                    where: eq(users.id, userId),
                    with: {
                        collaborations: {
                            with: {
                                project: true
                            }
                        },
                        ownedProjects: true
                    }
                });
    
            if (!user) {
                return undefined;
            }
    
            return user;
    },

    async getUserByTelegramUserId(telegramUserId: number) {
        const user = await db(env.DATABASE_URL)
                .query
                .users
                .findFirst({
                    where: eq(users.telegramUserId, telegramUserId),
                    with: {
                        collaborations: {
                            with: {
                                project: true
                            }
                        },
                        ownedProjects: true
                    }
                });
    
            if (!user) {
                return undefined;
            }
    
            return user;
    },

    async updateUser(id: string, data: Partial<{ 
        name: string; 
        telegramChatId: number 
    }>) {
      const [updatedUser] = await db(env.DATABASE_URL)
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    },
  
    async deleteUser(id: string) {
      const [deletedUser] = await db(env.DATABASE_URL)
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      return deletedUser;
    }
  });
  
  