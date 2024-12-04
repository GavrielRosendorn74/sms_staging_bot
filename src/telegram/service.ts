import { Env } from "..";
import { BotAction, chatBotService } from "../chatbot/service";
import { userService } from "../users/service"

export const telegramService = (env: Env) => ({
    async handleMessage(
        {   
            baseUrl,
            firstName,
            tUserId,
            tChatId,
            text
        } : {
            baseUrl: string,
            firstName: string,
            tUserId : number,
            tChatId : number,
            text: string
        }
    ) {
        const user = await this._retriveUser({ firstName, tUserId, tChatId})
        const {action, args} = this._parseMessage(text);

        await this.sendMessage({
            telegramChatId: user!.telegramChatId, 
            text: await chatBotService(env).handleAction({
                baseUrl: baseUrl,
                action: action,
                args: args,
                userId: user.id
            }),
            markdownv2: true
        })
    },

    _parseMessage(text: string) : {action : BotAction | undefined, args: string[]} {
        const textSplitted = text.split(' ');

        let action : BotAction | undefined;
        let args : string[] = [];

        if (textSplitted[0][0] === '/') {
            textSplitted[0] = textSplitted[0].substring(1);
            if (Object.values(BotAction).includes(textSplitted[0] as BotAction)) {
                action = textSplitted[0] as BotAction;
            }
            args = [...textSplitted];
            args.shift();
            args = args
                .map(e => e.trim())
                .filter(e => e.length > 0)
        }

        return {action, args};
    },

    async _retriveUser({   
        firstName,
        tUserId,
        tChatId,
    } : {
        firstName: string,
        tUserId : number,
        tChatId : number,
    }) {
        // RETRIVE USER
        let user = await userService(env).getUserByTelegramUserId(tUserId);

        // IF NOT FOUND CREATE IT
        if (!user)
            user = {
                ...(await userService(env).createUser({
                    telegramUserId: tUserId,
                    telegramChatId: tChatId,
                    name: firstName
                })),
                ownedProjects: [],
                collaborations: []
            }
        // OTHERWISE UPDATE IT
        else 
            user = {
                ...user,
                ...(await userService(env).updateUser(user.id, {
                    telegramChatId: tChatId,
                    name: firstName
                }))
            }

        return user;
    },

    async sendMessage({
        telegramChatId,
        text,
        markdownv2
    }: {
        telegramChatId: number,
        text: string,
        markdownv2 : boolean
    }) {        
        await fetch(
            `${env.TELEGRAM_API_SECRET_URL}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: text,
                    parse_mode: markdownv2 ? 'markdownv2' : undefined
                }),
            }
        )
    }
});