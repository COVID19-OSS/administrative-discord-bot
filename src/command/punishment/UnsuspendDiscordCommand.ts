import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed, TextChannel} from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

export class UnsuspendDiscordCommand extends DiscordCommand {
  static readonly REPLACE_MENTION_REGEX: RegExp = /[<>!@]/g;
  static readonly AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

  private async sendMessage(channel: TextChannel, messageType: string, params: string[] = []): Promise<void> {
    const messageEmbed: MessageEmbed = new MessageEmbed().setTitle("Un-Suspend");
    let valid = true;
    if (messageType === "usage") {
      messageEmbed.setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "suspend [mention/id]");
    } else if (messageType === "commandResponse") {
      messageEmbed.setFooter("Success!").setDescription("The user has been un-suspended.");
    } else if (messageType === "notSuspended") {
      messageEmbed.setFooter("An error was encountered.").setDescription("The user is not suspended.");
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
    if (this.args.length === 0) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }
    const toUnQuarantine = this.args[0].replace(UnsuspendDiscordCommand.REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = toUnQuarantine ? guild?.member(toUnQuarantine) : null;
    if (!member) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }

    const userSuspendedRole = member.roles.cache.filter(role => role.name === "Suspended").first();
    if (!userSuspendedRole) {
      await this.sendMessage(this.messageChannel, "notSuspended");
      return;
    }

    const defaultRole = guild?.roles.cache.filter(role => role.name === "Default").first();
    const roles = member.roles.cache.filter(role => role.name !== "Suspended");
    if (defaultRole) {
      roles.set(defaultRole?.id, defaultRole);
      await member.roles.set(roles);
    }

    await this.sendMessage(this.messageChannel, "commandResponse");

    if (this.messageChannel.name.startsWith("q-")) {
      await this.messageChannel.delete("Cleanup quarantined channel.");
    }
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => UnsuspendDiscordCommand.AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Un-quarantine command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_ROLES") || !this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute quarantine command - insufficient privileges");
      return false;
    }

    return true;
  }
}