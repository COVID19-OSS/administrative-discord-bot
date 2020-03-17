import { DiscordCommand } from "../DiscordCommand";
const { QUARANTINE_ROLES } = process.env;

export class SuspendDiscordCommand extends DiscordCommand {
  static readonly MENTION_REGEX: RegExp = /<@(\d+)>/
  static readonly SUSPENDING_ROLES = QUARANTINE_ROLES.split(',').map((s: string) => s.trim()) || [ "Administrator" ];
  public async execute(): Promise<void> {
    const toQuarantine = this.args.find(arg => arg.match(SuspendDiscordCommand.MENTION_REGEX))?.replace(SuspendDiscordCommand.MENTION_REGEX, '$1');    
    const guild = this.message.guild;
    const member = toQuarantine ? guild?.member(toQuarantine) : null;
    if(!member)
      return;
    
    const suspendedRole = guild?.roles.cache.filter(role => role.name === 'Suspended').first();
    const roles = member.roles.cache.filter(role => role.name !== 'Default');
    if(suspendedRole) {
      roles.set(suspendedRole?.id, suspendedRole);
      member.roles.set(roles);    
    }

    // Gonna steal this cheap hack for now ;)
    const maxQtChannel = guild?.channels.cache.filter(channel => channel.name.startsWith('q-'))
      .map(channel => parseInt(channel.name.split('-')[1], 10)).sort().pop() || 0;

    const qtChannel = await guild?.channels.create(`q-${maxQtChannel + 1}`, {
      reason: `Quarantine for user ${member.displayName} requested by ${this.message.author.id}`,
      permissionOverwrites: [{
        type: 'member',
        allow: ['VIEW_CHANNEL'],
        id: member.id            
      }],
      parent: 'quarantine'
    });

    qtChannel?.send(`You have been quarantined, <@${member.id}>. Attempting to re-rank as Default or leave the server will result in an instant ban. A mod will join presently.`)
  }

  public async validate(): Promise<boolean> {
    // Sanity check here...
    if(!this.args.find(arg => arg.match(SuspendDiscordCommand.MENTION_REGEX))) {
      console.error('Quarantine command with no valid user mention');
      return false;
    }

    if(!this.message.member?.roles.cache.some(role => SuspendDiscordCommand.SUSPENDING_ROLES.includes(role.name))) 
    {    
      console.error('Quarantine command used by user who is unable to access quarantine!');
      return false;
    }

    if(!this.message.guild?.me?.hasPermission('MANAGE_ROLES') || !this.message.guild?.me?.hasPermission('MANAGE_CHANNELS'))
    {
      console.error('Unable to execute quarantine command - insufficient privileges');
      return false;
    }
    
    return true;
  }
}