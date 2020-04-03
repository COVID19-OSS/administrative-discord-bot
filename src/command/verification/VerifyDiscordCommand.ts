import { DiscordCommand } from "../DiscordCommand";
import { MessageEmbed } from "discord.js";
import { DateTime } from "luxon";

import { MixPanelEvents } from "../../const/analytics/MixPanelEvents";

const { VERIFICATION_CHANNEL_ID, VERIFIED_ROLE, SUSPENDED_ROLE, VERIFICATION_FALLBACK_DURATION_SECONDS } = process.env;

/**
 * Verification Command
 * @author GUH <contact@covid19.fyi>
 *
 * This command will check if the user issuing the command is in the correct channel and needs the verified rank.
 * If they do, it gives it to them.
 */
export class VerifyDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { analyticService } = this.dependencies;
    const verifiedRole = this.message.guild?.roles.cache.filter(role => role.name === VERIFIED_ROLE).first();
    if (!verifiedRole) throw Error("No verified role found");

    const memberRoles = this.message.member?.roles.cache;
    if (!memberRoles) throw Error("No member roles found");

    memberRoles.set(verifiedRole?.id, verifiedRole);

    await Promise.all([
      this.message.member?.roles.set(memberRoles, "User Verified"),
      this.message.channel.send(new MessageEmbed().setTitle("Verification Success").setDescription(`${this.message.member} you have been verified!`)),
      this.message.delete()
    ]);

    analyticService.track(MixPanelEvents.VERIFICATION_SUCCESS, { "distinct_id": this.message.author.id });
  }

  public async validate(): Promise<boolean> {
    const { repositoryRegistry: { verificationCodeRepository }, verificationCodeService, analyticService } = this.dependencies;

    if (this.message.channel.id !== VERIFICATION_CHANNEL_ID) return false;
    if (!this.message.member) return false;
    if (this.message.member.roles.cache.some(role => role.name === SUSPENDED_ROLE)) return false;
    if (this.message.member.roles.cache.some(role => role.name === VERIFIED_ROLE)) {
      await Promise.all([
        this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.author}, you already are verified!`)),
        this.message.delete()
      ]);
      return false;
    }

    /* Invalid syntax*/
    if (this.args.length !== 1) {
      await Promise.all([
        this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.author} The verification code you entered is not valid.`)),
        this.message.delete()
      ]);
      return false;
    }

    const mostRecentVerificationCodes = await verificationCodeRepository.getLastCodes(2);
    /* If there are no codes, verification cannot occur */
    if (mostRecentVerificationCodes.length === 0) {
      await Promise.all([
        this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.author} No verification codes found, please contact an administrator.`)),
        this.message.delete()
      ]);
      return false;
    }

    /* If the most recent one matches, let them through */
    if (this.args[0] === mostRecentVerificationCodes[0].code) {
      const validTo = DateTime.fromJSDate(mostRecentVerificationCodes[0].valid_to, { zone: "utc" });
      const timeSinceExpiration = validTo.diff(DateTime.utc());
      /* If the code has expired, generate a new code */
      if (timeSinceExpiration.as("second") < 0) {
        const newCode = await verificationCodeService.generateNewVerificationCode();
        await verificationCodeService.updateRulesEmbed(newCode);
      }
      return true;
    }
    /* Otherwise check if the submitted code is in the grace period */
    else if (mostRecentVerificationCodes.length === 2 && this.args[0] === mostRecentVerificationCodes[1].code) {
      const currentCreatedAt = DateTime.fromJSDate(mostRecentVerificationCodes[0].created_at, { zone: "utc" });
      const timeSinceCurrentCodeCreated = DateTime.utc().diff(currentCreatedAt);
      if (timeSinceCurrentCodeCreated.as("seconds") < Number(VERIFICATION_FALLBACK_DURATION_SECONDS)) {
        return true;
      }
      else {
        await Promise.all([
          this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.author} The verification code you entered is expired.`)),
          this.message.delete()
        ]);
        analyticService.track(MixPanelEvents.VERIFICATION_FAIL_EXPIRED, { "distinct_id": this.message.author.id });
        return false;
      }
    }
    /* Neither code valid */
    else {
      await Promise.all([
        this.message.channel.send(new MessageEmbed().setTitle("Verification Error").setDescription(`${this.message.author} The verification code you entered is not valid.`)),
        this.message.delete()
      ]);
      analyticService.track(MixPanelEvents.VERIFICATION_FAIL_BAD_CODE, { "distinct_id": this.message.author.id });
      return false;
    }
  }
}
