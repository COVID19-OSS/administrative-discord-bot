import { DiscordCommandType } from "./DiscordCommandType";
import { DiscordCommand } from "./DiscordCommand";

import { StuckChannelDiscordCommand } from "./punishment/StuckChannelDiscordCommand";
import { SuspendDiscordCommand } from "./punishment/SuspendDiscordCommand";
import { UnsuspendDiscordCommand } from "./punishment/UnsuspendDiscordCommand";
import { HelpDiscordCommand } from "./help/HelpDiscordCommand";

import { CommandDependencies } from "../definitions/dependencies/CommandDependencies";

import {Message, TextChannel} from "discord.js";

export class DiscordCommandRegistry {
  private static getRegistry(): Map<string, DiscordCommand> {
    const registry = new Map<DiscordCommandType, DiscordCommand>();
    registry.set(DiscordCommandType.STUCKCHANNEL, StuckChannelDiscordCommand.prototype);
    registry.set(DiscordCommandType.SUSPEND, SuspendDiscordCommand.prototype);
    registry.set(DiscordCommandType.UNSUSPEND, UnsuspendDiscordCommand.prototype);
    registry.set(DiscordCommandType.HELP, HelpDiscordCommand.prototype);
    return registry;
  }

  public static getCommand(command: string, args: Array<string>, message: Message, dependencies: CommandDependencies): DiscordCommand | null {
    const registry = this.getRegistry();

    const CommandForType = registry.get(command.toLowerCase());
    if (!CommandForType) return null;

    const ReflectedCommand = Object.create(CommandForType);
    const messageChannel = message.channel as TextChannel;
    return new ReflectedCommand.constructor(dependencies, command, args, message, messageChannel);
  }
}