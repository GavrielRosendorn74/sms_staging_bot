import { zValidator } from "@hono/zod-validator";
import { Context, Hono } from "hono";
import { z } from "zod";
import { telegramService } from "./service";
import { Bindings } from "hono/types";
import { Env } from "..";

export const telegramMessageSchema = z.object({
    message: z.object({
        from: z.object({
            id: z.number(),
            first_name: z.string(),
            is_bot: z.boolean()
        }),
        chat: z.object({
            id: z.number(),
        }),
        text: z.string()
    })
});

const telegramApp = new Hono<{Bindings: Env}>()

telegramApp.post('/webhook_handler',
    zValidator('json', telegramMessageSchema, (r, c) => {
        console.log(r.success);
        if (!r.success) return c.json({status: 'success'});
    }),
    async (c) => {
        const { message } = await c.req.valid('json');

        if(message.from.is_bot) {
            return c.json({status : 'error', error: 'Bot not accepted.'}, 403);
        }

        await telegramService(c.env).handleMessage({
            baseUrl: (new URL(c.req.url)).origin,
            firstName: message.from.first_name,
            tUserId: message.from.id,
            tChatId: message.chat.id,
            text: message.text
        });
 
        return c.json({
            status : 'success'
        });
})

export default telegramApp;