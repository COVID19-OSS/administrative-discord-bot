import { DiscordCommandType } from "./DiscordCommandType";
import { DiscordCommand } from "./DiscordCommand";

import { HistoryDiscordCommand } from "./punishment/HistoryDiscordCommand";
import { StuckChannelDiscordCommand } from "./punishment/StuckChannelDiscordCommand";
import { SuspendDiscordCommand } from "./punishment/SuspendDiscordCommand";
import { UnsuspendDiscordCommand } from "./punishment/UnsuspendDiscordCommand";
import { HelpDiscordCommand } from "./help/HelpDiscordCommand";

import { CommandDependencies } from "../definitions/dependencies/CommandDependencies";

import {Message} from "discord.js";

export class DiscordCommandRegistry {
  private static getRegistry(): Map<string, DiscordCommand> {
    const registry = new Map<DiscordCommandType, DiscordCommand>();
    registry.set(DiscordCommandType.HISTORY, HistoryDiscordCommand.prototype);
    registry.set(DiscordCommandType.STUCK_CHANNEL, StuckChannelDiscordCommand.prototype);
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
    return new ReflectedCommand.constructor(dependencies, command, args, message);
  }
}