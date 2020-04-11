import { DateTime } from "luxon";
import { MessageEmbed, TextChannel } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { PunishmentType } from "../../definitions/entities/PunishmentType";

import { REPLACE_MENTION_REGEX } from "../../const/RegexConstants";
import { DateUtilities } from "../../utilities/DateUtilities";

const { MUTED_ROLE, LIMITED_MUTER_ROLES, STAFF_ROLES, AUDIT_LOG_CHANNEL_ID } = process.env;

const staffRoles =  (STAFF_ROLES || "").split(",");
const limitedMuterRoles = (LIMITED_MUTER_ROLES || "").split(",");

export class MuteDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { repositoryRegistry: { punishmentRepository }, discordService: { discordInstance } } = this.dependencies;

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const reason = this.args.splice(2).join(" ");

    const guild = this.message.guild;
    const targetMember = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;
    if (!targetMember) throw Error("User not in guild after validation");

    const roles = targetMember.roles.cache;
    const mutedRole = guild?.roles.cache.find(role => role.name === MUTED_ROLE);
    if (!mutedRole) throw Error("No muted role found");

    roles.set(mutedRole?.id, mutedRole);
    await targetMember.roles.set(roles);

    const offenderUserId = await this.getCoalescedUserId(targetDiscordUserId);
    const moderatorUserId = await this.getCoalescedUserId(this.message.author.id);

    const durationSeconds = DateUtilities.parseDurationStringToSeconds(this.args[1]);

    const now = DateTime.utc();
    const expiration = DateTime.utc().plus({ seconds: durationSeconds });

    await punishmentRepository.create(offenderUserId, moderatorUserId, reason || null, PunishmentType.MUTE, true, now.toJSDate(), expiration.toJSDate());

    const auditChannel = await discordInstance.channels.fetch(AUDIT_LOG_CHANNEL_ID || "") as TextChannel;
    if (!auditChannel) {
      console.warn("No audit channel found");
      return;
    }

    const auditEmbed = new MessageEmbed()
      .setTitle(`:mute: [Mute] ${targetMember.user.username}#${targetMember.user.discriminator}`)
      .setThumbnail(targetMember.user.displayAvatarURL())
      .addField("User", targetMember, true)
      .addField("Moderator", this.message.author, true)
      .addField("Expires", expiration.plus({ minutes: 1 }).toRelative(), true)
      .setTimestamp();

    if (reason) auditEmbed.addField("Reason", reason, true);

    await auditChannel.send(auditEmbed);
    await this.message.channel.send(new MessageEmbed().setTitle(":mute: Mute Success").setDescription(`${targetMember} successfully muted`));
  }

  public async validate(): Promise<boolean> {
    const { repositoryRegistry: { punishmentRepository } } = this.dependencies;
    /* Permissions */
    if (!this.message.member?.roles.cache.some(role => staffRoles.includes(role.name))) {
      console.warn(`Mute command issued by user without authority ${this.message.author.username}`);
      return false;
    }

    /* Syntax */
    if (this.args.length < 2) {
      const embed = new MessageEmbed()
        .setTitle("Mute Help")
        .setDescription("The duration is a time string: `(1h, 1m, 30s, etc.)`\n\n **Usage:**\n`>mute <mention/id> <duration> <reason>`\n`>mute <mention/id> <duration>`");
      await this.message.channel.send(embed);
      return false;
    }

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const targetMember = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;

    /* Member of this server */
    if (!targetMember) {
      const embed = new MessageEmbed().setTitle("Mute Error").setDescription("User is not a member of this server.");
      await this.message.channel.send(embed);
      return false;
    }

    /* Protected Role */
    if (targetMember.roles.cache.some(role => staffRoles.includes(role.name)) || targetMember.user.bot) {
      const embed = new MessageEmbed().setTitle("Mute Error").setDescription("This user has a protected role.");
      await this.message.channel.send(embed);
      return false;
    }

    /* Target user is not already muted */
    const userMuteRole = targetMember.roles.cache.find(role => role.name === MUTED_ROLE);
    const activeUserMutes = await punishmentRepository.getActiveByPunishmentTypeAndUser(PunishmentType.MUTE, targetMember.user.id);
    if (userMuteRole || activeUserMutes.length > 0) {
      const embed = new MessageEmbed().setTitle("Mute Error").setDescription("User has already been muted.");
      await this.message.channel.send(embed);
      return false;
    }

    /* Limited Role Constraints */
    if (this.message.member?.roles.cache.some(role => limitedMuterRoles.includes(role.name))) {
      /* Cannot exceed 15 minutes */
      const durationSeconds = DateUtilities.parseDurationStringToSeconds(this.args[1]);
      if (durationSeconds > 60 * 15) {
        const embed = new MessageEmbed().setTitle("Mute Error").setDescription("Your role does not permit mutes over 15 minutes.");
        await this.message.channel.send(embed);
        return false;
      }
      /* Must specify a reason */
      if (this.args.length < 3) {
        const embed = new MessageEmbed().setTitle("Mute Error").setDescription("Your role requires a reason to mute someone.");
        await this.message.channel.send(embed);
        return false;
      }
    }

    return true;
  }
}
