import { DiscordService } from "./services/DiscordService";
import { PostgresDriver } from "./services/PostgresDriver";
import { RepositoryRegistry } from "./database/RepositoryRegistry";
import { DiscordCommandListener } from "./command/DiscordCommandListener";

export class Application {
  private readonly discordService: DiscordService;
  private readonly postgresDriver: PostgresDriver;

  public constructor() {
    this.discordService = new DiscordService();
    this.postgresDriver = new PostgresDriver();

    const databaseRegistry = new RepositoryRegistry(this.postgresDriver);
    new DiscordCommandListener({ discordService: this.discordService, repositoryRegistry: databaseRegistry });
  }

  public async start(): Promise<void> {
    await this.postgresDriver.start();
    console.log("Connected to DB");
    await this.discordService.start();
    console.log("Connected to Discord");
  }

  public async stop(): Promise<void> {
    this.discordService.stop();
    await this.postgresDriver.stop();
  }
}