import { DateTime } from "luxon";
import { MessageEmbed, TextChannel } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { DiscordCommandType } from "../DiscordCommandType";
import { PermissionUtilities } from "../../utilities/PermissionUtilities";
import { PunishmentType } from "../../definitions/entities/PunishmentType";

import { REPLACE_MENTION_REGEX } from "../../const/RegexConstants";

const { DISCORD_PREFIX, AUDIT_LOG_CHANNEL_ID } = process.env;

export class WarnDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { repositoryRegistry: { punishmentRepository }, discordService: { discordInstance } } = this.dependencies;

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");

    const moderatorUserId = await this.getCoalescedUserId(this.message.author.id);
    const offenderUserId = await this.getCoalescedUserId(targetDiscordUserId);

    await punishmentRepository.create(offenderUserId, moderatorUserId, this.args[1], PunishmentType.WARN, true, DateTime.utc().toJSDate());

    const guild = this.message.guild;
    const targetMember = guild?.member(targetDiscordUserId);
    if (!targetMember) throw Error("Expected to have target member");

    const warningEmbed = new MessageEmbed()
      .setTitle(`:warning: [Warn] ${targetMember.user.username}#${targetMember.user.discriminator}`)
      .setColor("#d4b350")
      .setDescription(`Reason: ${this.args[1]}`);

    await this.message.channel.send({
      content: `<@${targetDiscordUserId}>`,
      embed: warningEmbed
    });

    const auditChannel = await discordInstance.channels.fetch(AUDIT_LOG_CHANNEL_ID || "") as TextChannel;
    if (!auditChannel) {
      console.warn("No audit channel found");
      return;
    }

    const auditEmbed = new MessageEmbed()
      .setTitle(`:warning: [Warn] ${targetMember.user.username}#${targetMember.user.discriminator}`)
      .setThumbnail(targetMember.user.displayAvatarURL())
      .addField("User", targetMember, true)
      .setColor("#d4b350")
      .addField("Moderator", this.message.author, true)
      .addField("Reason", this.args[1], true)
      .setTimestamp();

    await auditChannel.send(auditEmbed);
  }

  async validate(): Promise<boolean> {
    if (!PermissionUtilities.isModerator(this.message.member)) {
      console.log(`Warn command issued by user without permission ${this.message.author.username}`);
      return false;
    }

    if (this.args.length !== 2) {
      await this.message.channel.send(new MessageEmbed().setTitle("Warning Error").setDescription(`Usage: \`${DISCORD_PREFIX}${DiscordCommandType.WARN} <mention/id> <reason>\``));
      return false;
    }

    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const targetMember = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;
    if (!targetMember) {
      await this.message.channel.send(new MessageEmbed().setTitle("Warning Error").setDescription("User is not a member of this server"));
      return false;
    }

    if (PermissionUtilities.isStaff(targetMember) || targetMember.user.bot) {
      await this.message.channel.send(new MessageEmbed().setTitle("Warning Error").setDescription(`<@${targetDiscordUserId}> has a protected role`));
      return false;
    }

    return true;
  }

}
