import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed, TextChannel} from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

const REPLACE_MENTION_REGEX = /[<>!@]/g;
const AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

export class HistoryDiscordCommand extends DiscordCommand {

  private async sendMessage(channel: TextChannel, messageType: string, params: string[] = []): Promise<void> {
    const messageEmbed: MessageEmbed = new MessageEmbed().setTitle("History");
    let valid = true;
    if (messageType === "usage") {
      messageEmbed.setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "history [mention/id]");
    } else if (messageType === "commandResponse") {
      let history = "";
      for (let x = 1; x < params.length; x++) {
        history += params[x] + "\n";
      }
      messageEmbed.setFooter("Success!").setDescription("User history for: <@" + params[0] + ">\n" + history);
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
    const { quarantineRepository, userRepository } = this.dependencies.repositoryRegistry;
    if (this.args.length === 0) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }
    const toViewHistory = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = toViewHistory ? guild?.member(toViewHistory) : null;
    if (!member) {
      await this.sendMessage(this.messageChannel, "usage");
      return;
    }
    const params = [toViewHistory];
    const userHistory = await quarantineRepository.getFiveMostRecentByOffenderDiscordId(toViewHistory);
    for (const quarantine of userHistory) {
      const moderatorUser = await userRepository.getByUserId(quarantine.moderator_user_id);
      if (moderatorUser) {
        params.push(quarantine.created_at.toLocaleString() + " by <@" + moderatorUser.discord_id + "> with the reason: " + ((quarantine.reason) ? quarantine.reason : "None"));
      }
    }
    await this.sendMessage(this.messageChannel, "commandResponse", params);
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("History command used by user who does not have permission!");
      return false;
    }

    return true;
  }
}