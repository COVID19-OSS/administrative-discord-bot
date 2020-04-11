import { MessageEmbed, TextChannel } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { PunishmentType } from "../../definitions/entities/PunishmentType";

import { REPLACE_MENTION_REGEX } from "../../const/RegexConstants";

const { STAFF_ROLES, MUTED_ROLE, AUDIT_LOG_CHANNEL_ID } = process.env;

const staffRoles =  (STAFF_ROLES || "").split(",");

export class UnmuteDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { repositoryRegistry: { punishmentRepository }, discordService: { discordInstance } } = this.dependencies;

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;

    const offenderMember = await guild?.members.fetch(targetDiscordUserId);
    if (!offenderMember) throw Error("Target user not defined after validate");

    const activeMutes = await punishmentRepository.getActiveByPunishmentTypeAndUser(PunishmentType.MUTE, offenderMember.id);
    const isRoleMuted = !!offenderMember.roles.cache.find(role => role.name === MUTED_ROLE);

    if (activeMutes.length < 1 && !isRoleMuted) {
      await this.message.channel.send(new MessageEmbed().setTitle("Unmute Error").setDescription(`${offenderMember.user} is not muted`));
      return;
    }

    if (activeMutes) {
      await Promise.all(activeMutes.map(punishment => punishmentRepository.updateActive(punishment.punishment_id, false)));
    }

    if (isRoleMuted) {
      const roles = offenderMember.roles.cache.filter(role => role.name !== MUTED_ROLE);
      await offenderMember.roles.set(roles, "Mute removed by staff");
    }

    await this.message.channel.send(new MessageEmbed().setTitle("Unmute Success").setDescription(`${offenderMember.user} has been unmuted`));

    const auditChannel = await discordInstance.channels.fetch(AUDIT_LOG_CHANNEL_ID || "") as TextChannel;
    await auditChannel.send(new MessageEmbed()
      .setTitle(`:mute: [Unmute] ${offenderMember.user.username}#${offenderMember.user.discriminator}`)
      .setDescription(`${offenderMember.user} has been unmuted by ${this.message.author}`)
    );
  }

  public async validate(): Promise<boolean> {
    /* Permissions */
    if (!this.message.member?.roles.cache.some(role => staffRoles.includes(role.name))) {
      console.warn(`Unmute command issued by user without authority ${this.message.author.username}`);
      return false;
    }

    /* Syntax */
    if (this.args.length !== 1) {
      const embed = new MessageEmbed()
        .setTitle("Unmute Help")
        .setDescription("**Usage:** `>unmute <mention/id>`");
      await this.message.channel.send(embed);
      return false;
    }

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const targetMember = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;

    /* Member of this server */
    if (!targetMember) {
      const embed = new MessageEmbed().setTitle("Unmute Error").setDescription("User is not a member of this server.");
      await this.message.channel.send(embed);
      return false;
    }

    return true;
  }
}
