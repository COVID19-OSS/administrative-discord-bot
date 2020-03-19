import {Message, TextChannel} from "discord.js";
import { CommandDependencies } from "../definitions/dependencies/CommandDependencies";

export abstract class DiscordCommand {
  protected readonly dependencies: CommandDependencies;
  protected readonly command: string;
  protected readonly args: Array<string>;
  protected readonly message: Message;
  protected readonly messageChannel: TextChannel;

  public constructor(dependencies: CommandDependencies, command: string, args: Array<string>, message: Message, messageChannel: TextChannel) {
    this.dependencies = dependencies;
    this.command = command;
    this.args = args;
    this.message = message;
    this.messageChannel = messageChannel;
  }

  public abstract async validate(): Promise<boolean>;
  public abstract async execute(): Promise<void>;
}
