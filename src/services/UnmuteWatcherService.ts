import { DateTime } from "luxon";
import { Mutex } from "async-mutex";

import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";
import { PunishmentType } from "../definitions/entities/PunishmentType";
import { MessageEmbed, TextChannel } from "discord.js";

const { AUDIT_LOG_CHANNEL_ID, MUTED_ROLE } = process.env;

export class UnmuteWatcherService {
  private readonly dependencies: ListenerDependencies;

  private readonly watcherMutex: Mutex;
  private watcherPid?: NodeJS.Timeout;

  constructor(dependencies: ListenerDependencies) {
    this.dependencies = dependencies;
    this.watcherMutex = new Mutex();
  }

  public start(): void {
    this.watcherPid = setInterval(async () => {
      await this.findActiveExpiredMutes();
    }, 1000 * 10);
  }

  private async findActiveExpiredMutes(): Promise<void> {
    const { repositoryRegistry: { punishmentRepository, userRepository }, discordService: { discordInstance } } = this.dependencies;

    if (this.watcherMutex.isLocked()) return;
    const release = await this.watcherMutex.acquire();

    const auditChannel = await discordInstance.channels.fetch(AUDIT_LOG_CHANNEL_ID || "") as TextChannel;
    const guild = auditChannel.guild;

    try {
      const activeMutes = await punishmentRepository.getActiveByPunishmentType(PunishmentType.MUTE);
      const activeExpiredMutes = activeMutes.filter(punishment => {
        if (!punishment.expires_at) return false;
        const timeLeftSeconds = DateTime.fromJSDate(punishment.expires_at).diffNow("second").seconds;
        return timeLeftSeconds < 0;
      });
      if (activeExpiredMutes.length > 0) {
        const offendersToUnmute = await Promise.all(activeExpiredMutes.map(punishment => userRepository.getByUserId(punishment.offender_user_id)));

        for (let i = 0; i < offendersToUnmute.length; i++) {
          const offender = offendersToUnmute[i];
          const offenderMember = await guild.members.fetch(offender?.discord_id || "");
          if (!offenderMember) continue;

          const roles = offenderMember.roles.cache.filter(role => role.name !== MUTED_ROLE);

          await offenderMember.roles.set(roles, "Temporary Mute Expired");

          await auditChannel.send(new MessageEmbed()
            .setTitle(`:mute: [Unmute] ${offenderMember.user.username}#${offenderMember.user.discriminator}`)
            .setDescription(`${offenderMember.user} has automatically been unmuted`)
          );
        }
        await Promise.all(activeExpiredMutes.map(punishment => punishmentRepository.updateActive(punishment.punishment_id, false)));
        console.log(`Unmmuted ${activeExpiredMutes.length} users`);
      }
    }
    catch (error) {
      console.error("Could not find active expired mutes");
      console.error(error);
    }
    finally {
      release();
    }
  }

  public async stop(): Promise<void> {
    await this.watcherMutex.acquire();
    if (this.watcherPid) clearInterval(this.watcherPid);
  }
}
