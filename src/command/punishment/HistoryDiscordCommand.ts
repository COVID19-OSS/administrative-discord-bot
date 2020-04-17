import { MessageEmbed } from "discord.js";
import { DateTime } from "luxon";

import { DiscordCommand } from "../DiscordCommand";

import { User } from "../../definitions/entities/User";
import { StringUtilities } from "../../utilities/StringUtilities";

import { REPLACE_MENTION_REGEX } from "../../const/RegexConstants";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

const AUTHORIZED_ROLES = QUARANTINE_ROLES ? QUARANTINE_ROLES.split(",").map((s: string) => s.trim()) : [ "Administrator" ];

interface HistoryEmbedFieldData {
  reason?: string;
  moderator?: User | null;
  createdAt: DateTime;
  type: string;
}

export class HistoryDiscordCommand extends DiscordCommand {

  public async execute(): Promise<void> {
    const { quarantineRepository, userRepository, punishmentRepository } = this.dependencies.repositoryRegistry;

    const targetUserDiscordId = this.args[0].replace(REPLACE_MENTION_REGEX, "");

    /* Get the last five quarantines for this user */
    const quarantines = await quarantineRepository.getBulkByOffenderId(targetUserDiscordId, 25);
    const punishments = await punishmentRepository.getByOffenderDiscordId(targetUserDiscordId, 25);

    /* No need to get the same moderator multiple times, make a UQ set and fetch */
    const moderatorUserIds = quarantines.map(quarantine => quarantine.moderator_user_id).concat(punishments.map(punishment => punishment.moderator_user_id));
    const uniqueModeratorUserIds = [... new Set(moderatorUserIds)];
    const quarantineModerators = await Promise.all(uniqueModeratorUserIds.map(moderatorId => userRepository.getByUserId(moderatorId)));

    /* Build an array of message */
    let historyFields = quarantines.reduce((historyMessages: Array<HistoryEmbedFieldData>, quarantine) => {
      const moderator = quarantineModerators.find(user => user?.user_id === quarantine.moderator_user_id);
      const createdAt = DateTime.fromJSDate(quarantine.created_at, { zone: "utc" });
      historyMessages.push({ reason: quarantine.reason, moderator, createdAt, type: "Suspension" });
      return historyMessages;
    }, []);


    historyFields = historyFields.concat(punishments.reduce((historyMessages: Array<HistoryEmbedFieldData>, punishment) => {
      const moderator = quarantineModerators.find(user => user?.user_id === punishment.moderator_user_id);
      const createdAt = DateTime.fromJSDate(punishment.created_at, { zone: "utc" });
      historyMessages.push({ moderator, createdAt, reason: punishment.reason, type: punishment.punishment_type });
      return historyMessages;
    }, []));

    historyFields.sort((a, b) => {
      return b.createdAt.valueOf() - a.createdAt.valueOf();
    });

    historyFields = historyFields.slice(0, 10);

    const embed = new MessageEmbed()
      .setFooter("I'm a bot beep boop.");

    if (historyFields.length > 0) {
      embed.setTitle(":warning: Punishment History");
      embed.setColor("#d4b350");
      embed.setDescription(`The last ${historyFields.length} punishments for <@${targetUserDiscordId}>:`);
      historyFields.forEach((historyFieldData, index) => {
        embed.addField(`${index+1}. ${StringUtilities.toTitleCase(historyFieldData.type)}`, `Occurred ${historyFieldData.createdAt.toRelative()}\nFor \`${historyFieldData.reason || "Unspecified"}\`\nBy <@${historyFieldData.moderator?.discord_id}>`, false);
      });
    }
    else {
      embed.setTitle(":white_check_mark: Punishment History");
      embed.setColor("#76af5e");
      embed.setDescription(`There is no punishment history for <@${targetUserDiscordId}>.`);
    }

    await this.message.channel.send(embed);
  }

  public async validate(): Promise<boolean> {
    /* Role check */
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("History command used by user who does not have permission!");
      return false;
    }
    /* Argument check */
    if (this.args.length === 0) {
      await this.message.channel.send(
        new MessageEmbed()
          .setTitle("History")
          .setDescription(`Usage: \`${DISCORD_PREFIX}history [mention/id]\``)
          .setFooter("An error has occurred.")
          .setColor("#d4443f")
      );
      return false;
    }

    /* Target user is a member of this discord server */
    const targetUserDiscordId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = targetUserDiscordId ? guild?.member(targetUserDiscordId) : null;
    if (!member) {
      await this.message.channel.send(
        new MessageEmbed()
          .setTitle("History")
          .setDescription(`<@${targetUserDiscordId}> is not a member of this server.\n\nUsage: \`${DISCORD_PREFIX}history [mention/id]\``)
          .setFooter("An error has occurred.")
          .setColor("#d4443f")
      );
      return false;
    }
    return true;
  }
}
