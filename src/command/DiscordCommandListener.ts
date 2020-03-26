import bind from "bind-decorator";
import { Message } from "discord.js";

import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";
import { DiscordCommandRegistry } from "./DiscordCommandRegistry";

const { DISCORD_PREFIX } = process.env;

export class DiscordCommandListener {
  private readonly dependencies: ListenerDependencies;

  public constructor(commandDependencies: ListenerDependencies) {
    this.dependencies = commandDependencies;
    commandDependencies.discordService.bindMessageListener(this.handleDiscordCommand);
  }

  @bind
  private async handleDiscordCommand(message: Message): Promise<void> {
    try {
      if (!message.content.startsWith(DISCORD_PREFIX!) || message.author.bot || message.channel.type !== "text") return;

      // Filter the args with no length to solve the problem when a space character is entered and then a user's name is clicked on when using mobile
      const args: Array<string> = message.content?.slice(DISCORD_PREFIX!.length).split(/ +/);
      const command = args.shift()?.toLowerCase();

      const commandExecutor = DiscordCommandRegistry.getCommand(command || "", args, message, this.dependencies);
      if (!commandExecutor) return;

      const isValid = await commandExecutor.validate();
      if (!isValid) return;

      await commandExecutor.execute();
    }
    catch (e) {
      console.error(e);
      await message.channel.send("An irrecoverable error has occurred while executing this command. Please contact an administrator");
    }
  }
}
