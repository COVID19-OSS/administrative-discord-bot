import { GuildMember } from "discord.js";

const { MODERATION_ROLES } = process.env;

export class PermissionUtilities {
  private static getModerationRoles(): Array<string> {
    if (!MODERATION_ROLES) return [];
    return MODERATION_ROLES.split(",");
  }
  public static isModerator(member: GuildMember | null): boolean {
    if (!member) return false;
    return member.roles.cache.some(role => this.getModerationRoles().includes(role.name));
  }
}
