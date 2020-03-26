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
}
