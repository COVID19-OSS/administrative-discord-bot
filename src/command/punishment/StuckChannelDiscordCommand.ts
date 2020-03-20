import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed, TextChannel} from "discord.js";

const { QUARANTINE_ROLES } = process.env;

const AUTHORIZED_ROLES = QUARANTINE_ROLES ? QUARANTINE_ROLES.split(",").map((s: string) => s.trim()) : [ "Administrator" ];

export class StuckChannelDiscordCommand extends DiscordCommand {

  public async execute(): Promise<void> {
    await this.message.channel.delete("Cleanup quarantined channel.");
  }

  public async validate(): Promise<boolean> {
    /* Role check */
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Stuck channel command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute stuck channel command - insufficient privileges");
      return false;
    }

    const messageChannel = this.message.channel as TextChannel;
    if (!messageChannel.name.startsWith("q-")) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Stuck Channel").setFooter("An error was encountered.").setDescription("This can only be used in quarantine channels.")
      });
      return false;
    }

    return true;
  }
}