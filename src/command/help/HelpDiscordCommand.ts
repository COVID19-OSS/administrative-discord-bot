import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as mustache from "mustache";

const readFileAsync = util.promisify(fs.readFile);

import { DiscordCommand } from "../DiscordCommand";
import { MessageEmbed } from "discord.js";

export class HelpDiscordCommand extends DiscordCommand {
  public async execute(): Promise<void> {
    const rulesEmbed = new MessageEmbed().setTitle("Server Rules");
    const rulesText = await readFileAsync(path.join(__dirname, "../../../templates/rules/rules.txt"), "utf8");
    const renderedRules = mustache.render(rulesText, { verifyCode: "foo" });
    const rules = renderedRules.split("\n").filter(rule => rule.length > 0);
    rules.forEach((rule, index) => rulesEmbed.addField(`Rule ${index+1}`, rule, false));
    await this.message.channel.send(rulesEmbed);
    // await this.message.channel.send(new MessageEmbed().setTitle("Help Menu").setDescription("Help").setFooter(`Version ${process.env.npm_package_version}`));
  }

  public async validate(): Promise<boolean> {
    return true;
  }
}
