import { MessageEmbed } from "discord.js";
import { DateTime } from "luxon";

import { DiscordCommand } from "../DiscordCommand";

import { REPLACE_MENTION_REGEX } from "../../Constants";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

const AUTHORIZED_ROLES = QUARANTINE_ROLES ? QUARANTINE_ROLES.split(",").map((s: string) => s.trim()) : [ "Administrator" ];

export class HistoryDiscordCommand extends DiscordCommand {

  public async execute(): Promise<void> {
    const { quarantineRepository, userRepository } = this.dependencies.repositoryRegistry;

    const targetUserDiscordId = this.args[0].replace(REPLACE_MENTION_REGEX, "");

    /* Get the last five quarantines for this user */
    const quarantines = await quarantineRepository.getBulkByOffenderId(targetUserDiscordId, 5);

    /* No need to get the same moderator multiple times, make a UQ set and fetch */
    const uniqueModerators = [... new Set(quarantines.map(quarantine => quarantine.moderator_user_id))];
    const quarantineModerators = await Promise.all(uniqueModerators.map(moderatorId => userRepository.getByUserId(moderatorId)));

    /* Build an array of message */
    const historyMessages = quarantines.reduce((historyMessages: Array<string>, quarantine) => {
      const moderator = quarantineModerators.find(user => user?.user_id === quarantine.moderator_user_id);
      const createdAt = DateTime.fromJSDate(quarantine.created_at, { zone: "utc" });
      historyMessages.push(`${createdAt.toRelative()} by <@${moderator?.discord_id!}> for ${quarantine.reason || "None"}`);
      return historyMessages;
    }, []);

    await this.message.channel.send({
      embed: new MessageEmbed().setTitle("History").setFooter("Success!").setDescription(`User history for: <@${targetUserDiscordId}>\n ${historyMessages.join("\n")}`)
    });
  }

  public async validate(): Promise<boolean> {
    /* Role check */
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("History command used by user who does not have permission!");
      return false;
    }
    /* Argument check */
    if (this.args.length === 0) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("History").setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "history [mention/id]")
      });
      return false;
    }

    /* Target user is a member of this discord server */
    const targetUserDiscordId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = targetUserDiscordId ? guild?.member(targetUserDiscordId) : null;
    if (!member) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Suspend").setFooter(`<@${targetUserDiscordId}> is not a member of this server.`).setDescription(`Usage: ${DISCORD_PREFIX} suspend [mention/id] <reason>`)
      });
      return false;
    }
    return true;
  }
}
