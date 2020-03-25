import { DiscordCommand } from "../DiscordCommand";
import { GuildChannel, MessageEmbed, TextChannel } from "discord.js";

const { RULES_ROLES, RULES_CHANNEL_ID } = process.env;

export class CycleVerificationCodeDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { verificationCodeService } = this.dependencies;

    const nextVerificationCode = await verificationCodeService.generateNewVerificationCode();
    await verificationCodeService.updateRulesEmbed(nextVerificationCode);

    await this.message.channel.send(new MessageEmbed().setTitle("Cycle Verification Code Success").setDescription(`The code has been updated to \`${nextVerificationCode}\``));
  }

  private getRulesChannel(): GuildChannel | undefined {
    return this.message.guild?.channels.cache.find(channel => channel.id === RULES_CHANNEL_ID);
  }

  public async validate(): Promise<boolean> {
    const { verificationCodeService } = this.dependencies;

    if (!this.message.member) return false;
    const rulesRoles = RULES_ROLES ? RULES_ROLES.split(",") : [];
    /* Has permissions */
    if (!this.message.member.roles.cache.some(role => rulesRoles.includes(role.name))) return false;
    /* Has channel */
    const rulesChannel = this.getRulesChannel() as TextChannel;
    if (!rulesChannel) {
      await this.message.channel.send(new MessageEmbed().setTitle("Cycle Verification Code Error").setDescription("The rules channel could not be found!"));
      return false;
    }
    const rulesMessage = await verificationCodeService.getRulesMessage(rulesChannel);
    if (!rulesMessage) {
      await this.message.channel.send(new MessageEmbed().setTitle("Cycle Verification Code Error").setDescription("The rules message could not be found!"));
      return false;
    }
    return true;
  }
}
