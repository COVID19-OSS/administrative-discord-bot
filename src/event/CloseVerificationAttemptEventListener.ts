import bind from "bind-decorator";

import { Message, MessageEmbed } from "discord.js";

import { EventListener } from "./EventListener";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";
import { DiscordCommandType } from "../command/DiscordCommandType";

const { VERIFICATION_CHANNEL_ID, VERIFIED_ROLE, DISCORD_PREFIX } = process.env;

export class CloseVerificationAttemptEventListener extends EventListener {
  public constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    dependencies.discordService.bindMessageListener(this.handleCloseVerificationAttempt);
  }

  @bind
  private async handleCloseVerificationAttempt(message: Message): Promise<void> {
    if (message.channel.id !== VERIFICATION_CHANNEL_ID) return;
    if (message.member?.roles.cache.some(role => role.name === VERIFIED_ROLE)) return;
    const missingSpace = message.content.startsWith(DISCORD_PREFIX!) && message.content.split(" ").length !== 2;
    if (message.content.startsWith(DiscordCommandType.VERIFY) || missingSpace) {
      const description = `Hey there ${message.author} we noticed that you might be having some difficulty verifying your account.\n\n`
        + "You might need to add the `>` symbol in front of your message or have a space between the `>command code` so our system can pick it up correctly. We look forward to you joining our community!\n\n"
        + "Please refrain from contacting our staff if you have not read the rules, it might result in your removal from our community";
      const embed = new MessageEmbed()
        .setTitle("COVID19 Community Discord - Verification")
        .setDescription(description)
        .setThumbnail("https://i.imgur.com/UyieFtd.png")
        .setColor("#d4443f")
        .setFooter("I'm a robot. Beep boop.");
      await message.author.send(embed);
    }
  }
}
