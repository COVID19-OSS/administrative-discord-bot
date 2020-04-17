import { GuildMember } from "discord.js";

const { MODERATION_ROLES, STAFF_ROLES } = process.env;

export class PermissionUtilities {
  public static isModerator(member: GuildMember | null): boolean {
    if (!member) return false;
    return member.roles.cache.some(role => this.getModerationRoles().includes(role.name));
  }

  public static isStaff(member: GuildMember | null): boolean {
    if (!member) return false;
    return member.roles.cache.some(role => this.getStaffRoles().includes(role.name));
  }

  private static getModerationRoles(): Array<string> {
    if (!MODERATION_ROLES) return [];
    return MODERATION_ROLES.split(",");
  }

  private static getStaffRoles(): Array<string> {
    if (!STAFF_ROLES) return [];
    return STAFF_ROLES.split(",");
  }
}
