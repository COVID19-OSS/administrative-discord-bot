import { DiscordCommand } from "../DiscordCommand";
import { Channel, GuildMember, MessageEmbed, TextChannel } from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES, STAFF_ROLES } = process.env;

const REPLACE_MENTION_REGEX = /[<>!@]/g;
const AUTHORIZED_ROLES = QUARANTINE_ROLES?.split(",").map((s: string) => s.trim()) || [ "Administrator" ];
const PROTECTED_ROLES = STAFF_ROLES?.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

export class SuspendDiscordCommand extends DiscordCommand {

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
    const { quarantineRepository } = this.dependencies.repositoryRegistry;
    const toQuarantine = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const reasonProvided: string = this.args.splice(1).join(" ");
    const guild = this.message.guild;
    const member = toQuarantine ? guild?.member(toQuarantine) : null;
    if (!member) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }

    if (member?.roles.cache.some(role => PROTECTED_ROLES.includes(role.name))) {
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

    const qtCategory: Channel | undefined = guild?.channels.cache.filter(channel => channel.name.toLowerCase() === "quarantine" && channel.type == "category").first();
    if (!qtCategory) {
      return;
      // should send error message
    }

    if (!this.message.member) return;
    const quarantineId = await this.persistQuarantine(member, this.message.member, reasonProvided);

    const qtChannel = await guild?.channels.create("q-" + quarantineId, {
      reason: "Quarantine for user " + member.displayName + " requested by " + this.message.member?.displayName,
      permissionOverwrites: [{
        type: "member",
        allow: ["VIEW_CHANNEL"],
        id: qtCategory.id
      }],
      parent: qtCategory.id
    });

    if (qtChannel) {
      await this.sendMessage(qtChannel, "channelNotification", [member.id, reasonProvided || "None"]);
      await quarantineRepository.updateChannelId(quarantineId, qtChannel.id);
    }
  }

  private async persistQuarantine(member: GuildMember, moderator: GuildMember, reason: string): Promise<number> {
    const { quarantineRepository } = this.dependencies.repositoryRegistry;

    const offenderUserId = await this.getCoalescedUserId(member.id);
    const moderatorUserId = await this.getCoalescedUserId(moderator.id);

    return quarantineRepository.create(offenderUserId, moderatorUserId, reason);
  }

  private async getCoalescedUserId(discordUserId: string): Promise<number> {
    const { userRepository } = this.dependencies.repositoryRegistry;
    const user = await userRepository.getByDiscordId(discordUserId);
    if (user) return user.user_id;

    return await userRepository.create({ discordUserId: discordUserId });
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Quarantine command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_ROLES") || !this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute quarantine command - insufficient privileges");
      return false;
    }

    if (this.args.length === 0) {
      await this.sendMessage(this.messageChannel, "usage");
      return false;
    }

    return true;
  }
}