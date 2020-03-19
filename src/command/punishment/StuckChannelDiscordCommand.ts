import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed, TextChannel} from "discord.js";

const { QUARANTINE_ROLES } = process.env;

export class StuckChannelDiscordCommand extends DiscordCommand {
  static readonly REPLACE_MENTION_REGEX: RegExp = /[<>!@]/g;
  static readonly AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

  private async sendMessage(channel: TextChannel, messageType: string, params: string[] = []): Promise<void> {
    const messageEmbed: MessageEmbed = new MessageEmbed().setTitle("Un-Suspend");
    let valid = true;
    if (messageType === "notCorrectChannel") {
      messageEmbed.setFooter("An error was encountered.").setDescription("This can only be used in quarantine channels.");
    } else {
      valid = false;
    }
    if (valid) {
      await channel.send({
        embed: messageEmbed
      });
    }
  }

  public async execute(): Promise<void> {
    if (this.messageChannel.name.startsWith("q-")) {
      await this.messageChannel.delete("Cleanup quarantined channel.")
    } else {
      await this.sendMessage(this.messageChannel, "notCorrectChannel");
    }
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => StuckChannelDiscordCommand.AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Stuck channel command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute stuck channel command - insufficient privileges");
      return false;
    }

    return true;
  }
}