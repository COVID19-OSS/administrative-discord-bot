import bind from "bind-decorator";

import { GuildMember, MessageEmbed, TextChannel } from "discord.js";

import { EventListener } from "./EventListener";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

export class QuarantinedUserExitEventListener extends EventListener {
  constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    this.dependencies.discordService.bindUserExitListener(this.handleUserExitEvent);
  }

  @bind
  private async handleUserExitEvent(member: GuildMember): Promise<void> {
    const { repositoryRegistry: { quarantineRepository, userRepository }, discordService } = this.dependencies;
    try {
      /* If user is not suspended we do not care */
      if (!member.roles.cache.some(role => role.name.toLowerCase() === "suspended")) return;
      const mostRecentQuarantine = await quarantineRepository.getMostRecentByOffenderDiscordId(member.id);
      if (!mostRecentQuarantine || !mostRecentQuarantine.channel_id) throw Error(`User in quarantine left without any database record ${member.id}`);

      const quarantineChannel = await discordService.discordInstance.channels.fetch(mostRecentQuarantine.channel_id) as TextChannel;
      if (!quarantineChannel) throw Error(`Quarantine channel does not exist for user ${member.id}`);

      const moderatorUser = await userRepository.getByUserId(mostRecentQuarantine.moderator_user_id);

      const warningEmbed = new MessageEmbed()
        .setTitle("Possible Quarantine Evasion")
        .setColor("#d4b350")
        .setDescription(`:warning: Warning: ${member} has left the server.`)
        .setTimestamp()
        .setThumbnail(member.user.displayAvatarURL());

      if (moderatorUser) {
        await quarantineChannel.send({ content: `<@${moderatorUser.discord_id}>`, embed: warningEmbed });
      }
      else {
        await quarantineChannel.send(warningEmbed);

      }

    }
    catch (e) {
      console.error("Could not handle user exit event");
      console.error(e);
    }
  }
}
