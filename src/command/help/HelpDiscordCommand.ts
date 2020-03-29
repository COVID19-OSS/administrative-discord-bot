import { DiscordCommand } from "../DiscordCommand";
import { MessageEmbed } from "discord.js";

export class HelpDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    await this.message.channel.send(new MessageEmbed().setTitle("Help Menu").setDescription("Help"));
  }

  public async validate(): Promise<boolean> {
    return true;
  }
}
