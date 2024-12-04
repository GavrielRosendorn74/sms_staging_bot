import { and, eq } from "drizzle-orm";
import db from "../db";
import { projects } from "../db/schema/projects";
import { collaborations } from "../db/schema/collaborations";
import { users } from "../db/schema/users";
import { Env } from "..";

const charSetAccepted = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_123456789";

const generateRandomString = (length: number): string => {
    let result = '';
    const charactersLength = charSetAccepted.length;
    for (let i = 0; i < length; i++) {
        result += charSetAccepted.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const formatProjectName = (name: string): string => {
    let formattedName = name.trim().toUpperCase().replace(/\s+/g, "_");
    
    for (let i = 0; i < formattedName.length; i++) {
        if (!charSetAccepted.includes(formattedName.charAt(i))) {
            throw new Error(`Caractère non autorisé dans le nom: ${formattedName.charAt(i)}`);
        }
    }
    
    return formattedName;
};

export const projectService = (env: Env) => ({
    async addColaboratorToProject({
        projectId,
        userId,
    }: {
        projectId : string,
        userId : string,
    }) {
        try {
            if (
                await db(env.DATABASE_URL)
                    .query
                    .collaborations
                    .findFirst({
                        where: and(eq(collaborations.projectId, projectId), eq(collaborations.userId, userId)),
                    })
            )
                return true;
            await db(env.DATABASE_URL)
                .insert(collaborations)
                .values({
                    projectId,
                    userId
                });
            return true;
        } catch (_) {
            return false;
        }
    },

    async removeColaboratorFromProject({
        projectId,
        userId,
    }: {
        projectId : string,
        userId : string,
    }) {
        try {
            const collab =  await db(env.DATABASE_URL)
                    .query
                    .collaborations
                    .findFirst({
                        where: and(eq(collaborations.projectId, projectId), eq(collaborations.userId, userId)),
                    });
            if (collab) {
                await db(env.DATABASE_URL)
                    .delete(collaborations)
                    .where(and(eq(collaborations.projectId, projectId), eq(collaborations.userId, userId)))
                    .returning();
                return true;
            }
            return true;
        } catch (_) {
            return false;
        }
    },

    async createProject({
        name,
        ownerId,
    }: {
        name: string;
        ownerId: string;
    }) {
        const secretAccessKey = generateRandomString(8);
        const secretApiKey = generateRandomString(40);

        const formattedName = formatProjectName(name);

        const [project] = await db(env.DATABASE_URL)
            .insert(projects)
            .values({ 
                name: formattedName, 
                ownerId, 
                secretAccessKey, 
                secretApiKey
            })
            .returning();

        return project;
    },

    async getProjectById(projectId: string) {
        try {
            const project = await db(env.DATABASE_URL)
                .query
                .projects
                .findFirst({
                    where: eq(projects.id, projectId),
                    with: {
                        collaborators: {
                            with: {
                                user: true
                            }
                        },
                        owner: true
                    }
                });

            return project;
        } catch (_) {
            return undefined;
        }
    },

    async getUsersNeedToReciveMessageProjectById(projectId: string) {
        const project = await this.getProjectById(projectId);

        if (!project) return [];

        const users = project?.collaborators.map((u) => u.user) ?? [];

        users.push(project.owner);

        const uniqueUsers = Array.from(new Map(users.map(user => [user.id, user])).values());

        return uniqueUsers;
    },

    async updateProject(id: string, data: Partial<{ 
        name: string,
        ownerId: string,
        secretAccessKey : boolean, 
        secretApiKey : boolean
    }>) {
      const [updatedProject] = await db(env.DATABASE_URL)
        .update(projects)
        .set({
            name: data.name ? formatProjectName(data.name) : undefined,
            ownerId: data.ownerId,
            secretAccessKey: data.secretAccessKey === true ? generateRandomString(8) : undefined,
            secretApiKey: data.secretApiKey === true ? generateRandomString(40) : undefined
        })
        .where(eq(users.id, id))
        .returning();
      return updatedProject;
    },
  

    async deleteProject(id: string) {
        const [deletedProject] = await db(env.DATABASE_URL)
            .delete(projects)
            .where(eq(projects.id, id))
            .returning();

        return deletedProject;
    },
})