import { Chance } from "chance";
import { DateTime } from "luxon";

import { RepositoryRegistry } from "../repository/RepositoryRegistry";
import { DiscordService } from "./DiscordService";
import { Message, TextChannel } from "discord.js";
import { RulesUtilities } from "../utilities/RulesUtilities";

const { RULES_CHANNEL_ID } = process.env;

export class VerificationCodeService {
  public constructor(private readonly repositoryRegistry: RepositoryRegistry, private readonly discordService: DiscordService) {}

  public async generateNewVerificationCode(): Promise<string> {
    const { verificationCodeRepository } = this.repositoryRegistry;
    const now = DateTime.utc();

    const previousCodes = await verificationCodeRepository.getLastCodes(1);
    if (previousCodes.length > 0 ) await verificationCodeRepository.updateValidTo(previousCodes[0].verification_code_id, now.toJSDate());

    const chance = new Chance();
    const nextCode = chance.string({ length: 5, numeric: true, alpha: true, casing: "lower" });

    const validTo = now.plus({ minute: 1 });
    await verificationCodeRepository.create(nextCode, now.toJSDate(), validTo.toJSDate());

    return nextCode;
  }

  public async getRulesMessage(rulesChannel: TextChannel): Promise<Message | undefined> {
    const channelMessages = await rulesChannel.messages.fetch();
    return channelMessages.find(message => message.embeds.filter(embed => embed.title === "Server Rules").length > 0);
  }

  public async updateRulesEmbed(verificationCode: string): Promise<void> {
    const rulesGuildChannel = await this.discordService.discordInstance.channels.fetch(RULES_CHANNEL_ID || "");
    if (!rulesGuildChannel) throw Error(`Could not find rules channel ${RULES_CHANNEL_ID}`);
    if (rulesGuildChannel.type !== "text") throw Error(`Rules channel is not a text channel ${RULES_CHANNEL_ID}`);
    const rulesChannel = rulesGuildChannel as TextChannel;

    const rulesMessage = await this.getRulesMessage(rulesChannel);
    if (!rulesMessage) throw Error("No rules message");

    const rulesEmbed = await RulesUtilities.getRulesEmbed(verificationCode);
    await rulesMessage.edit(rulesEmbed);
  }
}
