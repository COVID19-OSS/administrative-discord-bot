import { Message } from "discord.js";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

export abstract class DiscordCommand {
  protected readonly dependencies: ListenerDependencies;
  protected readonly command: string;
  protected readonly args: Array<string>;
  protected readonly message: Message;

  public constructor(dependencies: ListenerDependencies, command: string, args: Array<string>, message: Message) {
    this.dependencies = dependencies;
    this.command = command;
    this.args = args;
    this.message = message;
  }

  public abstract async validate(): Promise<boolean>;
  public abstract async execute(): Promise<void>;

  protected async getCoalescedUserId(discordUserId: string): Promise<number> {
    const { userRepository } = this.dependencies.repositoryRegistry;
    const user = await userRepository.getByDiscordId(discordUserId);
    if (user) return user.user_id;

    return await userRepository.create({ discordUserId: discordUserId });
  }
}
