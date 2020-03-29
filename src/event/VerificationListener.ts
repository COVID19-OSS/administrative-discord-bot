import bind from "bind-decorator";
import { Message } from "discord.js";

import { EventListener } from "./EventListener";
import { DiscordCommandType } from "../command/DiscordCommandType";
import { DiscordCommandRegistry } from "../command/DiscordCommandRegistry";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

/**
 * VerificationListener
 *
 * Users struggle to use commands for some reason, so this allows them to just type the verification command without a prefix.
 */
export class VerificationListener extends EventListener {
  constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    this.dependencies.discordService.bindMessageListener(this.handleVerificationMessage);
  }

  @bind
  private async handleVerificationMessage(message: Message): Promise<void> {
    const args = message.content.split(" ");
    const command = args.shift();
    if (command?.toLowerCase() === DiscordCommandType.VERIFY) {
      const commandExecutor = DiscordCommandRegistry.getCommand(DiscordCommandType.VERIFY, args, message, this.dependencies);

      const valid = await commandExecutor?.validate();
      if (!valid) return;

      await commandExecutor?.execute();
    }

  }
}
