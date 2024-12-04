import { Hono } from "hono";
import { Env } from "..";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { projectService } from "./service";
import { telegramService } from "../telegram/service";

const projectApp = new Hono<{Bindings: Env}>()

projectApp.post(
    '/:id/send_message',
    zValidator(
        'param', 
        z.object({
            id: z.string().uuid(),
        })
    ),
    zValidator(
        'query', 
        z.object({
            secret: z.string().min(1, 'Secret is required'),
        })
    ),
    zValidator(
        'json',
        z.object({
            message: z.string().min(1, "Message cannot be empty")
        })
    ),
    async (c) => {
        const { id } = c.req.param();
        const { message } = c.req.valid('json');
        const { secret } = c.req.valid('query');

        const project = await projectService(c.env).getProjectById(id);

        if (!project || secret != project.secretApiKey) {
            return c.json({ status: 'error', message: 'Invalid secret key or project id' }, 401);
        }

        const users = await projectService(c.env).getUsersNeedToReciveMessageProjectById(id);

        for (const user of users) {
            telegramService(c.env).sendMessage({
                telegramChatId: user.telegramChatId,
                text: message,
                markdownv2: false
            })
        }
        
        return c.json({
            status: 'success'
        });
    }
)

export default projectApp;