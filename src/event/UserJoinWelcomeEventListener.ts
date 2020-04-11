import fs from "fs";
import path from "path";
import util from "util";
import mustache from "mustache";
import bind from "bind-decorator";

import { GuildMember, MessageEmbed, TextChannel } from "discord.js";

import { EventListener } from "./EventListener";
import { ListenerDependencies } from "../definitions/dependencies/ListenerDependencies";

const WELCOME_TEMPLATE_RELATIVE_PATH = "../../templates/welcome/welcome.txt";

const readFileAsync = util.promisify(fs.readFile);

const { RULES_CHANNEL_ID, VERIFICATION_CHANNEL_ID } = process.env;

export class UserJoinWelcomeEventListener extends EventListener {
  public constructor(dependencies: ListenerDependencies) {
    super(dependencies);
    dependencies.discordService.bindUserJoinListener(this.handleUserJoinWelcome);
  }

  @bind
  private async handleUserJoinWelcome(member: GuildMember): Promise<void> {
    try {
      const description = await this.getRenderedWelcomeMessage(member);
      const embed = new MessageEmbed()
        .setTitle("COVID19 Community Discord - Welcome")
        .setDescription(description)
        .setColor("#d4443f")
        .setThumbnail("https://i.imgur.com/UyieFtd.png")
        .setFooter("I'm a robot. Beep boop");

      if (!VERIFICATION_CHANNEL_ID) return;

      const verifyChannel = await this.dependencies.discordService.discordInstance.channels.fetch(VERIFICATION_CHANNEL_ID) as TextChannel;
      await verifyChannel.send({ content: `<@${member.id}>`, embed: embed });
    }
    catch (error) {
      console.error("Could not handle user join welcome");
      console.error(error);
    }
  }

  private async getRenderedWelcomeMessage(member: GuildMember): Promise<string> {
    const templatePath = path.join(__dirname, WELCOME_TEMPLATE_RELATIVE_PATH);
    const template = await readFileAsync(templatePath, "utf8");
    return mustache.render(template, { joinedUserId: member.id, rulesChannelId: RULES_CHANNEL_ID });
  }
}
