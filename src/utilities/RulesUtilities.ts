import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as mustache from "mustache";

import { MessageEmbed } from "discord.js";

const readFileAsync = util.promisify(fs.readFile);

export class RulesUtilities {
  public static async getRulesEmbed(verifyCode: string): Promise<MessageEmbed> {
    const rulesEmbed = new MessageEmbed().setTitle("Server Rules").setColor("#d4443f");
    const rulesText = await readFileAsync(path.join(__dirname, "../../templates/rules/rules.txt"), "utf8");
    const renderedRules = mustache.render(rulesText, { verifyCode });
    const rules = renderedRules.split("\n").filter(rule => rule.length > 0);
    rules.forEach((rule, index) => rulesEmbed.addField(`Rule ${index+1}`, rule, false));
    return rulesEmbed;
  }
}
