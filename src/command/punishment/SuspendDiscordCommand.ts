import { DiscordCommand } from "../DiscordCommand";
import {Channel, MessageEmbed, TextChannel} from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES, STAFF_ROLES } = process.env;

export class SuspendDiscordCommand extends DiscordCommand {
  static readonly REPLACE_MENTION_REGEX: RegExp = /[<>!@]/g;
  static readonly AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];
  static readonly PROTECTED_ROLES = STAFF_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

  private async sendMessage(channel: TextChannel, messageType: string, params: string[] = []): Promise<void> {
    const messageEmbed: MessageEmbed = new MessageEmbed().setTitle("Suspend");
    let valid = true;
    if (messageType === "usage") {
      messageEmbed.setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "suspend [mention/id] <reason>");
    } else if (messageType === "commandResponse") {
      messageEmbed.setFooter("Success!").setDescription("The user has been suspended.");
    } else if (messageType === "protectedRole") {
      messageEmbed.setFooter("An error was encountered.").setDescription("The user has a protected role.");
    } else if (messageType === "alreadySuspended") {
      messageEmbed.setFooter("An error was encountered.").setDescription("The user has already been suspended.");
    } else if (messageType === "channelNotification") {
      messageEmbed.setFooter("Uh-oh.").setDescription("You have been suspeneded, <@" + params[0] + ">.\nReason: " + params[1]);
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
    const toQuarantine = this.args[0].replace(SuspendDiscordCommand.REPLACE_MENTION_REGEX, "");
    const reasonProvided: string = this.args.splice(1).join(" ");
    const guild = this.message.guild;
    const member = toQuarantine ? guild?.member(toQuarantine) : null;
    if (!member) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }

    if (member?.roles.cache.some(role => SuspendDiscordCommand.PROTECTED_ROLES.includes(role.name))) {
      this.sendMessage(this.messageChannel, "protectedRole");
      return;
    }

    const userSuspendedRole = member.roles.cache.filter(role => role.name === "Suspended").first();
    const roles = member.roles.cache.filter(role => role.name !== "Default");
    if (userSuspendedRole) {
      await this.sendMessage(this.messageChannel, "alreadySuspended");
      return;
    }

    const suspendedRole = guild?.roles.cache.filter(role => role.name === "Suspended").first();
    if (suspendedRole) {
      roles.set(suspendedRole?.id, suspendedRole);
      await member.roles.set(roles);
    }

    await this.sendMessage(this.messageChannel, "commandResponse");

    // Gonna steal this cheap hack for now ;)
    const maxQtChannel = guild?.channels.cache.filter(channel => channel.name.startsWith("q-"))
      .map(channel => parseInt(channel.name.split("-")[1], 10)).sort().pop() || 0;

    const qtCategory: Channel | undefined = guild?.channels.cache.filter(channel => channel.name.toLowerCase() === "quarantine" && channel.type == "category").first();
    if (!qtCategory) {
      return;
    }

    const qtChannel = await guild?.channels.create("q-" + (maxQtChannel + 1), {
      reason: "Quarantine for user " + member.displayName + " requested by " + this.message.member?.displayName,
      permissionOverwrites: [{
        type: "member",
        allow: ["VIEW_CHANNEL"],
        id: qtCategory.id
      }],
      parent: qtCategory.id
    });

    if (qtChannel) {
      await this.sendMessage(qtChannel, "channelNotification", [member.id, (reasonProvided !== "") ? reasonProvided : "None"]);
    }
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => SuspendDiscordCommand.AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Quarantine command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_ROLES") || !this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute quarantine command - insufficient privileges");
      return false;
    }
    
    return true;
  }
}