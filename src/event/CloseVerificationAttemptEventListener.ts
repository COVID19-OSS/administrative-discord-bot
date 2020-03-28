import bind from "bind-decorator";

import { Message, MessageEmbed } from "discord.js";

import { EventListener } from "./EventListener";
import { DiscordCommandType } from "../command/DiscordCommandType";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

const { VERIFICATION_CHANNEL_ID, VERIFIED_ROLE } = process.env;

export class CloseVerificationAttemptEventListener extends EventListener {
  public constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    dependencies.discordService.bindMessageListener(this.handleCloseVerificationAttempt);
  }

  @bind
  private async handleCloseVerificationAttempt(message: Message): Promise<void> {
    try {
      if (message.channel.id !== VERIFICATION_CHANNEL_ID) return;
      if (message.member?.roles.cache.some(role => role.name === VERIFIED_ROLE)) return;
      const missingSpace = message.content.split(" ").length !== 2;

      const embed = new MessageEmbed()
        .setTitle("COVID19 Community Discord - Verification")
        .setThumbnail("https://i.imgur.com/UyieFtd.png")
        .setColor("#d4443f")
        .setFooter("I'm a robot. Beep boop.");

      if (message.content.startsWith("!verify") || message.content.startsWith("?verify") || message.content.startsWith("verify")) {
        const description = `Hey there ${message.author} we noticed that you might be having some difficulty verifying your account.\n\n`
          + "The way in which you tried to verify yourself does not work on our server. Please read the rules carefully and you will find out how you can verify your account.\n\n"
          + "If you do not read the rules you might be subject to removal from our community.";
        embed.setDescription(description);
        await Promise.all([
          message.author.send(embed).catch(() => undefined),
          message.delete()
        ]);
      }
      else if (message.content.startsWith(DiscordCommandType.VERIFY) && missingSpace) {
        const description = `Hey there ${message.author} we noticed that you might be having some difficulty verifying your account.\n\n`
          + `We think you need to add a space between the \`${DiscordCommandType.VERIFY} code\`, this will allow our system to pick up your verification correctly. We look forward to you joining our community!\n\n`
          + "Please refrain from contacting our staff if you have not read the rules, it might result in your removal from our community";
        embed.setDescription(description);
        await Promise.all([
          message.author.send(embed).catch(() => undefined),
          message.delete()
        ]);
      }
    }
    catch (error) {
      console.error("Could not handle close verification attempt");
      console.error(error);
    }
  }
}
