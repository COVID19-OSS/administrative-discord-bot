import { Message } from "discord.js";

import { DiscordCommandType } from "./DiscordCommandType";
import { DiscordCommand } from "./DiscordCommand";

import { CycleVerificationCodeDiscordCommand } from "./verification/CycleVerificationCodeDiscordCommand";
import { StuckChannelDiscordCommand } from "./punishment/StuckChannelDiscordCommand";
import { RefreshRulesDiscordCommand } from "./rules/RefreshRulesDiscordCommand";
import { UnsuspendDiscordCommand } from "./punishment/UnsuspendDiscordCommand";
import { RefreshNewsDiscordCommand } from "./news/RefreshNewsDiscordCommand";
import { HistoryDiscordCommand } from "./punishment/HistoryDiscordCommand";
import { SuspendDiscordCommand } from "./punishment/SuspendDiscordCommand";
import { VerifyDiscordCommand } from "./verification/VerifyDiscordCommand";
import { UnmuteDiscordCommand } from "./punishment/UnmuteDiscordCommand";
import { MuteDiscordCommand } from "./punishment/MuteDiscordCommand";
import { WarnDiscordCommand } from "./punishment/WarnDiscordCommand";
import { HelpDiscordCommand } from "./help/HelpDiscordCommand";
import { BanDiscordCommand } from "./punishment/BanDiscordCommand";

import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";


export class DiscordCommandRegistry {
  private static getRegistry(): Map<string, DiscordCommand> {
    const registry = new Map<DiscordCommandType, DiscordCommand>();
    registry.set(DiscordCommandType.CYCLE_VERIFICATION_CODE, CycleVerificationCodeDiscordCommand.prototype);
    registry.set(DiscordCommandType.STUCK_CHANNEL, StuckChannelDiscordCommand.prototype);
    registry.set(DiscordCommandType.REFRESH_RULES, RefreshRulesDiscordCommand.prototype);
    registry.set(DiscordCommandType.REFRESH_NEWS, RefreshNewsDiscordCommand.prototype);
    registry.set(DiscordCommandType.UNSUSPEND, UnsuspendDiscordCommand.prototype);
    registry.set(DiscordCommandType.HISTORY, HistoryDiscordCommand.prototype);
    registry.set(DiscordCommandType.SUSPEND, SuspendDiscordCommand.prototype);
    registry.set(DiscordCommandType.VERIFY, VerifyDiscordCommand.prototype);
    registry.set(DiscordCommandType.UNMUTE, UnmuteDiscordCommand.prototype);
    registry.set(DiscordCommandType.MUTE, MuteDiscordCommand.prototype);
    registry.set(DiscordCommandType.HELP, HelpDiscordCommand.prototype);
    registry.set(DiscordCommandType.WARN, WarnDiscordCommand.prototype);
    registry.set(DiscordCommandType.BAN, BanDiscordCommand.prototype);
    return registry;
  }

  public static getCommand(command: string, args: Array<string>, message: Message, dependencies: ListenerDependencies): DiscordCommand | null {
    const registry = this.getRegistry();

    const CommandForType = registry.get(command.toLowerCase());
    if (!CommandForType) return null;

    const ReflectedCommand = Object.create(CommandForType);
    return new ReflectedCommand.constructor(dependencies, command, args, message);
  }
}
