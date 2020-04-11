import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as mustache from "mustache";

import { Channel, GuildMember, MessageEmbed } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";

import { REPLACE_MENTION_REGEX } from "../../const/RegexConstants";

const { DISCORD_PREFIX, QUARANTINE_ROLES, STAFF_ROLES, SUSPENDED_ROLE, VERIFIED_ROLE, SUSPENDED_TIME_TO_RESPOND_MINUTES, RULES_CHANNEL_ID } = process.env;

const AUTHORIZED_ROLES = QUARANTINE_ROLES?.split(",").map((s: string) => s.trim()) || [ "Administrator" ];
const PROTECTED_ROLES = STAFF_ROLES?.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

const NOTICE_PATH = path.join(__dirname, "../../../templates/suspend/notice.txt");

const readFileAsync = util.promisify(fs.readFile);

export class SuspendDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const { repositoryRegistry: { quarantineRepository } } = this.dependencies;
    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");

    const reasonProvided: string = this.args.splice(1).join(" ");
    const guild = this.message.guild;

    const member = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;
    if (!member) throw Error("User not in guild after validation");

    const roles = member.roles.cache.filter(role => role.name !== VERIFIED_ROLE);
    const suspendedRole = guild?.roles.cache.filter(role => role.name === SUSPENDED_ROLE).first();

    if (suspendedRole) {
      roles.set(suspendedRole?.id, suspendedRole);
      await member.roles.set(roles);
    }

    await this.message.channel.send({
      embed: new MessageEmbed().setTitle("Suspend").setFooter("Success!").setDescription("The user has been suspended.")
    });

    const qtCategory: Channel | undefined = guild?.channels.cache.filter(channel => channel.name.toLowerCase() === "quarantine" && channel.type == "category").first();
    if (!qtCategory) throw Error("Quarantine Category not found");

    if (!this.message.member) throw Error("Command issuer not found");
    const quarantineId = await this.persistQuarantine(member, this.message.member, reasonProvided);

    const qtChannel = await guild?.channels.create("q-" + quarantineId, {
      reason: `Quarantine for user ${member.displayName} requested by ${this.message.member.displayName}`,
      parent: qtCategory.id
    });

    if (!qtChannel) throw Error("Quarantine channel not found");
    await qtChannel.updateOverwrite(member, { VIEW_CHANNEL: true });
    const renderedDescription = await this.getNoticeDescription(member.id, this.message.member.id, reasonProvided);

    const noticeEmbed = new MessageEmbed()
      .setTitle(":warning: Quarantine Notice")
      .setColor("#d4b350")
      .setDescription(renderedDescription)
      .setFooter("I'm a robot. Beep boop.");

    await qtChannel.send({ embed: noticeEmbed, content: `${member}` });

    await quarantineRepository.updateChannelId(quarantineId, qtChannel.id);
  }

  public async validate(): Promise<boolean> {
    /* Issuer authority */
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Quarantine command used by user who does not have permission!");
      return false;
    }
    /* Permission authority */
    if (!this.message.guild?.me?.hasPermission("MANAGE_ROLES") || !this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute quarantine command - insufficient privileges");
      return false;
    }
    /* Argument count */
    if (this.args.length === 0) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Suspend").setFooter("An error was encountered.").setDescription(`Usage: \`${DISCORD_PREFIX}suspend [mention/id] <reason>\``)
      });
      return false;
    }
    /* Target user is member of the server */
    const targetDiscordUserId = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    const guild = this.message.guild;
    const member = targetDiscordUserId ? guild?.member(targetDiscordUserId) : null;
    if (!member) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Suspend").setFooter("An error was encountered.").setDescription(`Usage: \`${DISCORD_PREFIX}suspend [mention/id] <reason>\``)
      });
      return false;
    }
    /* Target user is not staff */
    if (member?.roles.cache.some(role => PROTECTED_ROLES.includes(role.name))) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Suspend").setFooter("An error was encountered.").setDescription("The user has a protected role.")
      });
      return false;
    }
    /* Target user is not already suspended */
    const userSuspendedRole = member.roles.cache.filter(role => role.name === SUSPENDED_ROLE).first();
    if (userSuspendedRole) {
      await this.message.channel.send({
        embed: new MessageEmbed().setTitle("Suspend").setFooter("An error was encountered.").setDescription("The user has already been suspended.")
      });
      return false;
    }
    return true;
  }

  private async persistQuarantine(member: GuildMember, moderator: GuildMember, reason: string): Promise<number> {
    const { quarantineRepository } = this.dependencies.repositoryRegistry;

    const offenderUserId = await this.getCoalescedUserId(member.id);
    const moderatorUserId = await this.getCoalescedUserId(moderator.id);

    return quarantineRepository.create(offenderUserId, moderatorUserId, reason);
  }

  private async getNoticeDescription(offenderUserId: string, moderatorUserId: string, quarantineReason: string): Promise<string> {
    const rawNotice = await readFileAsync(NOTICE_PATH, "utf8");
    return mustache.render(rawNotice, {
      offenderUserId,
      moderatorUserId,
      quarantineReason,
      suspendTimeToRespondMinutes: SUSPENDED_TIME_TO_RESPOND_MINUTES,
      rulesChannelId: RULES_CHANNEL_ID
    });
  }
}
