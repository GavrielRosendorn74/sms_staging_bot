import { SelectUser, users } from "../db/schema/users";
import { userService } from "../users/service";
import { Env } from "..";
import { projectService } from "../projects/service";

export enum BotAction {
    start = 'start',
    help = 'help',
    newProject = 'new_project',
    myProjects = 'my_projects',
    joinProject = 'join_project',
    removeProject = 'remove_project',
    leaveProject = 'leave_project',
    removeAllProjects = 'remove_all_projects',
}

function toMarkdownV2(inputString: string) {
    const specialChars = ['_', '*', '`', '{', '}', '[', ']', '(', ')', '#', '+', '-', '.', '!', '|'];
  
    return inputString.replace(/([_*`{}[\]()#+\-.!|])/g, '\\$1');
}
  
function toMarkdownV2Copy(copy: string) {
    return `\`${toMarkdownV2(copy)}\``;
}

export const chatBotService = (env: Env) => ({
    async handleAction(
        {action, args, userId, baseUrl}
        : {action: BotAction | undefined, args: string[], userId: string, baseUrl: string}
    ) : Promise<string> {
        const user = (await userService(env).getUserById(userId)) as SelectUser & any;

        if (!action)
            return toMarkdownV2("I’m not sure how to respond to your message.") + "\n"
                + toMarkdownV2("Try using /help to learn more about the actions I can perform.");

        switch(action) {
            case BotAction.newProject:
                return this.newProject(user, baseUrl, args);
            case BotAction.joinProject:
                return this.joinProject(user, args);
            case BotAction.myProjects:
                return this.myProjects(user, env, args);
            case BotAction.removeProject:
                return this.removeProject(user, env, args);
            case BotAction.leaveProject:
                return this.leaveProject(user, env, args);
            case BotAction.removeAllProjects:
                return this.removeAllProjects(user, env, args);
            default:
                return this.help(user);
        }
    },

    async joinProject(user: SelectUser, args: string[]) {
        if (args.length != 2)
            return toMarkdownV2("Error. Execute this action in this format :") 
                + "\n"
                + toMarkdownV2("/join_project id_of_project secret_access");
        
        const project = await projectService(env).getProjectById(args[0]);
        
        if (!project || project?.secretAccessKey !== args[1]) {
            return toMarkdownV2("Error. Wrong project or secret.") + "\n";
        }

        await projectService(env).addColaboratorToProject({
            projectId: project.id,
            userId: user.id
        });

        return toMarkdownV2(`Success ! You're in the project ${project.name} :)`)
    },
    
    async newProject(user: SelectUser, baseUrl: string, args: string[]) : Promise<string> {
        if (args.length != 1)
            return toMarkdownV2("Error. Execute this action in this format :") + "\n" 
            +  toMarkdownV2("/new_project name_of_your_project");
        
        const project = await projectService(env).createProject({
            name: args[0],
            ownerId: user.id
        })

        const curlMessage = `curl --location '${baseUrl}/projects/${project.id}/send_message?secret=${project.secretApiKey}' \\\\\n`
            + `--header 'Content-Type: application/json' \\\\\n`
            + `--data '{\n`
            + `   "message" : "Test message."\n`
            + `}'`;

        const joinMessage = toMarkdownV2(`/join_project ${project.id} ${project.secretAccessKey}`);

        return toMarkdownV2("Your new project was successfully created !")
            + "\n\n"
            + toMarkdownV2("Start redirect your SMS in dev/staging like this :")
            + "\n\n"
            + `\`\`\`\n${curlMessage}\`\`\``
            + "\n\n"
            + toMarkdownV2("Then to add collaborators to a project, ask them to send this message to me :")
            + "\n\n"
            + "```\n" + joinMessage + "```";  
    },

    async myProjects(user: SelectUser, env: Env, args: string[]) {
        if (args.length != 0)
            return toMarkdownV2("Error. Execute this action in this format :") + "\n" 
            +  toMarkdownV2("/my_projects");

        const fullUser = await userService(env).getUserById(user.id);

        const projects = [
            ...(fullUser?.ownedProjects ?? []),
            ...(fullUser?.collaborations?.map(e => e.project) ?? []),
        ]

        const uniqueProjects = Array.from(new Map(projects.map(p => [p.id, p])).values());

        let message = toMarkdownV2("These are your projects :") + "\n\n";

        for (const project of uniqueProjects)
            message += toMarkdownV2(`- ${project.name} (`) + toMarkdownV2Copy(`${project.id}`) + toMarkdownV2(`)`) + "\n" 
                    + toMarkdownV2(`access_key : `) + toMarkdownV2Copy(`${project.secretAccessKey}`) + "\n"
                    + toMarkdownV2(`access_api : `) + toMarkdownV2Copy(`${project.secretApiKey}`) + "\n\n"    
        
        return message;
    },

    async leaveProject(user: SelectUser, env: Env, args: string[]) {
        if (args.length != 1)
            return toMarkdownV2("Error. Execute this action in this format :") + "\n" 
            +  toMarkdownV2("/leave_project id_of_project");
        
        const project = await projectService(env).getProjectById(args[0]);

        if (!project || project.collaborators.filter(e => e.userId == user.id).length == 0)
            return toMarkdownV2("Error. You can't leave this project.")
        
        await projectService(env).removeColaboratorFromProject({
            projectId: project.id,
            userId: user.id
        })

        return toMarkdownV2("Project successfully leaved.");
    },

    async removeAllProjects(user: SelectUser, env: Env, args: string[]) {
        if (args.length != 1 || args[0] != "i_agree_to_remove_all_the_projects_i_own")
            return toMarkdownV2("Error. Execute this action in this format :") + "\n" 
            +  toMarkdownV2("/remove_all_projects i_agree_to_remove_all_the_projects_i_own");
    
        const projects = (await userService(env).getUserById(user.id))?.ownedProjects ?? [];
    
        for(const p of projects)
            projectService(env).deleteProject(p.id);

        return toMarkdownV2("All projects removed !");
    },

    async removeProject(user: SelectUser, env: Env, args: string[]) {
        if (args.length != 1)
            return toMarkdownV2("Error. Execute this action in this format :") + "\n" 
            +  toMarkdownV2("/remove_project id_of_project");

        const project = await projectService(env)
                        .getProjectById(args[0]);

        if (!project || project.ownerId != user.id) {
            return toMarkdownV2("This project does not exist or you're not able to remove it because you're not owner.")
        }

        await projectService(env).deleteProject(project.id);

        return toMarkdownV2("This project was successfully removed.")
    },

    async help(user: SelectUser) : Promise<string> {
        return toMarkdownV2("Welcome to StagingSmsBot !") + "\n"
            + "\n"
            + toMarkdownV2("This service was created for you to try with your team's SMS integration very easily without using your credits.") + "\n"
            + "\n"
            + toMarkdownV2("So feel free to Spam US ! ;)") + "\n"
            + "\n"
            + toMarkdownV2("To start redirecting the messages of your project to this bot, execute:") + "\n"
            + toMarkdownV2("/new_project name_of_your_project") + "\n"
            + "\n"
            + toMarkdownV2("This is the list of actions you can perform :") + "\n"
            + toMarkdownV2("/new_project name_of_project - Create a new project with name.") + "\n"
            + toMarkdownV2("/my_projects - List your projects.") + "\n"
            + toMarkdownV2("/info_project id_of_project - Get all info about project.") + "\n"
            + toMarkdownV2("/remove_project id_of_project - Remove project of id.") + "\n"
            + toMarkdownV2("/leave_project id_of_project - Leave project of id.") + "\n"
            + toMarkdownV2("/remove_all_projects - Remove all projects.") + "\n"
            + toMarkdownV2("/join_project id_of_project secret_access - Join project id.");
    }
})