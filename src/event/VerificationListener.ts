import bind from "bind-decorator";
import { Message } from "discord.js";

import { EventListener } from "./EventListener";
import { DiscordCommandType } from "../command/DiscordCommandType";
import { DiscordCommandRegistry } from "../command/DiscordCommandRegistry";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

export class VerificationListener extends EventListener {
  constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    this.dependencies.discordService.bindMessageListener(this.handleVerificationMessage);
  }

  @bind
  private async handleVerificationMessage(message: Message): Promise<void> {
    if (message.content.toLowerCase().startsWith(DiscordCommandType.VERIFY)) {
      const args = message.content.split(" ").slice(1);
      const commandExecutor = DiscordCommandRegistry.getCommand(DiscordCommandType.VERIFY, args, message, this.dependencies);

      const valid = await commandExecutor?.validate();
      if (!valid) return;

      await commandExecutor?.execute();
    }

  }
}
