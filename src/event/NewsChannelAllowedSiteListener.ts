import bind from "bind-decorator";

import { Message, MessageEmbed } from "discord.js";

import { EventListener } from "./EventListener";
import { LinkUtilities } from "../utilities/LinkUtilities";
import { PermissionUtilities } from "../utilities/PermissionUtilities";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

const { NEWS_CHANNEL_ID, NEWS_LISTING_CHANNEL_ID } = process.env;

export class NewsChannelAllowedSiteListener extends EventListener {
  constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    this.dependencies.discordService.bindMessageListener(this.handleNewsChannelMessage);
    this.dependencies.discordService.bindMessageUpdateListener(this.handleNewsChannelMessageEdit);
  }

  @bind
  private async handleNewsChannelMessageEdit(oldMessage: Message, newMessage: Message): Promise<void> {
    await this.validateNewsMessage(newMessage);
  }

  @bind
  private async handleNewsChannelMessage(message: Message): Promise<void> {
    await this.validateNewsMessage(message);
  }

  @bind
  private async validateNewsMessage(message: Message): Promise<void> {
    if (message.channel.id !== NEWS_CHANNEL_ID) return;

    /* Moderators are immune */
    if (PermissionUtilities.isModerator(message.member) || message.author.bot) return;

    const embed = new MessageEmbed()
      .setTitle("COVID19 Community Discord - News Policy Violation")
      .setThumbnail("https://i.imgur.com/UyieFtd.png")
      .setColor("#d4443f")
      .setFooter("I'm a robot. Beep boop.");

    /* Must have a link */
    const isUrl = LinkUtilities.isUrl(message.content);
    if (!isUrl) {
      if (message.deletable) await message.delete();
      await message.author.send(embed.setDescription(`You must send a valid link in the <#${NEWS_CHANNEL_ID}> channel.`));
      return;
    }

    let hostname;

    try {
      const url = new URL(message.content);
      hostname = url.hostname.toLowerCase().startsWith("www") ? url.hostname.split(".").slice(1).join(".").toLowerCase() : url.hostname.toLowerCase();
    }
    catch (e) {
      console.log("Error parsing", hostname);
      if (message.deletable) await message.delete();
      await message.author.send(embed.setDescription(`You must send a valid link in the <#${NEWS_CHANNEL_ID}> channel.`));
      return;
    }

    /* Check against the database of good sites, also try with www. */
    const isAllowed = LinkUtilities.isAllowedNewsSite(hostname);
    if (!isAllowed) {
      if (message.deletable) await message.delete();
      await message.author.send(embed.setDescription(`The link you sent in <#${NEWS_CHANNEL_ID}> (\`${message.content}\`) is not a trusted source.\n\nPlease check <#${NEWS_LISTING_CHANNEL_ID}> for allowed sites.\n\nIf you would like to suggest a source, please use this form: https://forms.gle/rSRPkpVhzLYKZaA66`));
      return;
    }
  }
}
