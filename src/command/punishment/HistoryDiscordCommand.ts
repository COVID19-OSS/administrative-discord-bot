import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed} from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

const REPLACE_MENTION_REGEX = /[<>!@]/g;
const AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

export class HistoryDiscordCommand extends DiscordCommand {

  public async execute(): Promise<void> {
    const { quarantineRepository, userRepository } = this.dependencies.repositoryRegistry;
    if (this.args.length === 0) {
      await this.messageChannel.send({
        embed: new MessageEmbed().setTitle("History").setFooter("An error was encountered.")
            .setDescription("Usage: " + DISCORD_PREFIX + "history [mention/id]")
      });
      return;
    }
    const toViewHistory = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = toViewHistory ? guild?.member(toViewHistory) : null;
    if (!member) {
      await this.messageChannel.send({
        embed: new MessageEmbed().setTitle("History").setFooter("An error was encountered.")
            .setDescription("Usage: " + DISCORD_PREFIX + "history [mention/id]")
      });
      return;
    }
    const history = [];
    const userHistory = await quarantineRepository.getFiveMostRecentByOffenderDiscordId(toViewHistory);
    for (const quarantine of userHistory) {
      const moderatorUser = await userRepository.getByUserId(quarantine.moderator_user_id);
      if (moderatorUser) {
        history.push(quarantine.created_at.toLocaleString() + " by <@" + moderatorUser.discord_id + "> with the reason: " + ((quarantine.reason) ? quarantine.reason : "None"));
      }
    }
    await this.messageChannel.send({
      embed: new MessageEmbed().setTitle("History").setFooter("Success!")
          .setDescription("User history for: <@" + toViewHistory + ">\n" + history.join("\n"))
    });
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("History command used by user who does not have permission!");
      return false;
    }

    return true;
  }
}