import { MessageEmbed, TextChannel } from "discord.js";

import { DiscordCommand } from "../DiscordCommand";
import { PermissionUtilities } from "../../utilities/PermissionUtilities";
import { AllowedNewsSites } from "../../data/AllowedNewsSites";

const { NEWS_LISTING_CHANNEL_ID, NEWS_CHANNEL_ID } = process.env;

export class RefreshNewsDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const newsListingChannel = this.getNewsListingChannel();
    if (!newsListingChannel) throw Error("Could not find news listing channel");

    const existingMessages = await newsListingChannel.messages.fetch();
    await newsListingChannel.bulkDelete(existingMessages);

    const messageEmbeds = await Promise.all([
      this.getListingEmbed(true, 0, 15),
      this.getListingEmbed(false, 15, 30)
    ]);

    for (let i = 0; i < messageEmbeds.length; i++) {
      await newsListingChannel.send(messageEmbeds[i]);
    }
  }

  private getNewsListingChannel(): TextChannel | null {
    return this.message.guild?.channels.cache.find(channel => channel.id === NEWS_LISTING_CHANNEL_ID) as TextChannel;
  }

  private async getListingEmbed(includeHeader: boolean, offset: number, count: number): Promise<MessageEmbed> {
    const embed =  new MessageEmbed().setColor("#d4443f");
    if (includeHeader) {
      embed.setTitle("Reliable News Sources")
        .setThumbnail("https://i.imgur.com/UyieFtd.png")
        .setDescription(`These sources have been vetted by our staff and are permitted in the <#${NEWS_CHANNEL_ID}> channel. If you would like to request a source be added please submit a request here:\nhttps://forms.gle/rSRPkpVhzLYKZaA66`);
    }
    AllowedNewsSites.forEach((country, index) => {
      if (index >= offset && index < offset + count) {
        embed.addField(country.country, country.sites.map(site => `${site.label} (${site.hostnames.join(", ")})`).join("\n"), false);
      }
    });
    return embed;
  }

  public async validate(): Promise<boolean> {
    if (!PermissionUtilities.isModerator(this.message.member)) return false;
    if (!this.getNewsListingChannel()) {
      await this.message.channel.send(new MessageEmbed().setTitle("Rules Refresh Error").setDescription("The rules channel could not be found"));
      return false;
    }
    return true;
  }
}
