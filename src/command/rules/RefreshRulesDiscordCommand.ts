import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { GuildChannel, MessageEmbed, TextChannel } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { RulesUtilities } from "../../utilities/RulesUtilities";

const readFileAsync = util.promisify(fs.readFile);

const { RULES_ROLES, RULES_CHANNEL_ID, VERIFIED_RULES_CHANNEL_ID } = process.env;

export class RefreshRulesDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { repositoryRegistry: { verificationCodeRepository }, verificationCodeService } = this.dependencies;
    const rulesChannels = this.getRulesChannels();

    if (rulesChannels.length === 0) throw Error("Could not find rules channel");
    for (let i = 0; i < rulesChannels.length; i++) {
      const rulesChannel = rulesChannels[i];
      if (rulesChannel.type === "text") {
        const textChannel = rulesChannel as TextChannel;
  
        const existingMessages = await textChannel.messages.fetch();
        await textChannel.bulkDelete(existingMessages);
  
        const currentVerificationCode = await verificationCodeRepository.getLastCodes(1);
        const verificationCode = currentVerificationCode.length > 0 ? currentVerificationCode[0].code : await verificationCodeService.generateNewVerificationCode();
  
        const messageEmbeds = await Promise.all([
          this.getWelcomeEmbed(),
          RulesUtilities.getRulesEmbed(verificationCode),
          this.getReportingEmbed(),
          this.getBoostsEmbed(),
          this.getDisclaimerEmbed()
        ]);
  
        for (let i = 0; i < messageEmbeds.length; i++) {
          await textChannel.send(messageEmbeds[i]);
        }
      }
    }

    const embed = new MessageEmbed()
    .setTitle("Rules Refresh")
    .setDescription(`Success in ${rulesChannels.length} channel(s)`);
    
    await this.message.channel.send(embed);
  }

  private async getWelcomeEmbed(): Promise<MessageEmbed> {
    const welcomeText = await readFileAsync(path.join(__dirname, "../../../templates/rules/welcome.txt"), "utf8");
    return new MessageEmbed()
      .setTitle("Welcome to the COVID19 Discord!")
      .setColor("#d4443f")
      .setThumbnail("https://i.imgur.com/UyieFtd.png")
      .setDescription(welcomeText);
  }

  private async getReportingEmbed(): Promise<MessageEmbed> {
    const reportingText = await readFileAsync(path.join(__dirname, "../../../templates/rules/reporting.txt"), "utf8");
    return new MessageEmbed()
      .setTitle("Reporting Someone")
      .setColor("#d4443f")
      .setDescription(reportingText);
  }

  private async getBoostsEmbed(): Promise<MessageEmbed> {
    const boostsText = await readFileAsync(path.join(__dirname, "../../../templates/rules/boosts.txt"), "utf8");
    return new MessageEmbed()
      .setTitle("Nitro Boosts")
      .setColor("#d4443f")
      .setDescription(boostsText);
  }

  private async getDisclaimerEmbed(): Promise<MessageEmbed> {
    const disclaimerText = await readFileAsync(path.join(__dirname, "../../../templates/rules/disclaimer.txt"), "utf8");
    return new MessageEmbed()
      .setTitle("Disclaimer")
      .setColor("#d4443f")
      .setDescription(disclaimerText);
  }

  private getRulesChannels(): Array<GuildChannel> {
    const rulesChannelsIds = [RULES_CHANNEL_ID, VERIFIED_RULES_CHANNEL_ID];
    const rulesChannels = rulesChannelsIds
      .map(ruleChannelId => {
        return this.message.guild?.channels.cache.find(channel => channel.id === ruleChannelId);
      })
      .filter(ruleChannel => ruleChannel !== undefined);
    return rulesChannels as Array<GuildChannel>;
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member) return false;
    const rulesRoles = RULES_ROLES ? RULES_ROLES.split(",") : [];
    if (!this.message.member.roles.cache.some(role => rulesRoles.includes(role.name))) return false;
    if (this.getRulesChannels().length === 0) {
      await this.message.channel.send(new MessageEmbed().setTitle("Rules Refresh Error").setDescription("The rules channel could not be found"));
      return false;
    }
    return true;
  }
}
