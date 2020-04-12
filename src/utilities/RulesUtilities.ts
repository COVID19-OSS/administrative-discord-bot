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

    const ruleLines = renderedRules.split("\n").filter(line => line.length > 0);

    for (let i = 0; i < ruleLines.length; i += 2) {
      rulesEmbed.addField(ruleLines[i], ruleLines[i+1]);
    }

    return rulesEmbed;
  }
}
