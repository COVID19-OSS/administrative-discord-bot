import { DiscordCommand } from "../DiscordCommand";
import { MessageEmbed } from "discord.js";

const { VERIFICATION_CHANNEL_ID, VERIFIED_ROLE } = process.env;

/**
 * Verification Command
 * @author GUH <contact@covid19.fyi>
 *
 * This command will check if the user issuing the command is in the correct channel and needs the verified rank.
 * If they do, it gives it to them.
 */
export class VerifyDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const verifiedRole = this.message.guild?.roles.cache.filter(role => role.name === VERIFIED_ROLE).first();
    if (!verifiedRole) throw Error("No verified role found");

    await this.message.member?.roles.set([verifiedRole], "User Verified");
  }

  public async validate(): Promise<boolean> {
    if (this.message.channel.id !== VERIFICATION_CHANNEL_ID) return false;
    if (!this.message.member) return false;
    if (this.message.member.roles.cache.some(role => role.name === VERIFIED_ROLE)) {
      await this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.member}, you already are verified`));
      return false;
    }
    return true;
  }
}
