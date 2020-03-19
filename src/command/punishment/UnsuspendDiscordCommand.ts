import { DiscordCommand } from "../DiscordCommand";
import {MessageEmbed} from "discord.js";

const { DISCORD_PREFIX, QUARANTINE_ROLES } = process.env;

const REPLACE_MENTION_REGEX = /[<>!@]/g;
const AUTHORIZED_ROLES = QUARANTINE_ROLES!.split(",").map((s: string) => s.trim()) || [ "Administrator" ];

export class UnsuspendDiscordCommand extends DiscordCommand {

  public async execute(): Promise<void> {
    const { quarantineRepository, userRepository } = this.dependencies.repositoryRegistry;
    let toUnQuarantine;
    if (this.args.length === 0) {
      if (!this.messageChannel.name.startsWith("q-")) {
        await this.messageChannel.send({
          embed: new MessageEmbed().setTitle("Un-Suspend").setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "unsuspend [mention/id]")
        });
        return;
      }
      const toUnQuarantineUser = await userRepository.getOffenderByDiscordChannel(this.messageChannel.id);
      if (toUnQuarantineUser) {
        toUnQuarantine = toUnQuarantineUser.discord_id;
      }
    } else {
      toUnQuarantine = this.args[0].replace(REPLACE_MENTION_REGEX, "");
    }
    const guild = this.message.guild;
    const member = toUnQuarantine ? guild?.member(toUnQuarantine) : null;
    if (!member) {
      await this.messageChannel.send({
        embed: new MessageEmbed().setTitle("Un-Suspend").setFooter("An error was encountered.").setDescription("Usage: " + DISCORD_PREFIX + "unsuspend [mention/id]")
      });
      return;
    }

    const userSuspendedRole = member.roles.cache.filter(role => role.name === "Suspended").first();
    if (!userSuspendedRole) {
      await this.messageChannel.send({
        embed: new MessageEmbed().setTitle("Un-Suspend").setFooter("An error was encountered.").setDescription("The user is not suspended.")
      });
      return;
    }

    const defaultRole = guild?.roles.cache.filter(role => role.name === "Default").first();
    const roles = member.roles.cache.filter(role => role.name !== "Suspended");
    if (defaultRole) {
      roles.set(defaultRole?.id, defaultRole);
      await member.roles.set(roles);
    }

    await this.messageChannel.send({
      embed: new MessageEmbed().setTitle("Un-Suspend").setFooter("Success!").setDescription("The user has been un-suspended.")
    });

    const quarantine = await quarantineRepository.getMostRecentByOffenderDiscordId(member.id);
    if (quarantine) {
      const foundChannel = guild?.channels.cache.filter(channel => channel.id === quarantine.channel_id).first();
      if (foundChannel) {
        foundChannel.delete("Channel cleanup from quarantine.");
      }
    }
  }

  public async validate(): Promise<boolean> {
    if (!this.message.member?.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.name))) {
      console.error("Un-quarantine command used by user who does not have permission!");
      return false;
    }

    if (!this.message.guild?.me?.hasPermission("MANAGE_ROLES") || !this.message.guild?.me?.hasPermission("MANAGE_CHANNELS")) {
      console.error("Unable to execute quarantine command - insufficient privileges");
      return false;
    }

    return true;
  }
}