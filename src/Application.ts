import Mixpanel from "mixpanel";

import { PostgresDriver } from "./services/PostgresDriver";
import { DiscordService } from "./services/DiscordService";
import { RepositoryRegistry } from "./repository/RepositoryRegistry";
import { VerificationCodeService } from "./services/VerificationCodeService";

import { ListenerDependencies } from "./definitions/dependencies/ListenerDependencies";

import { DiscordCommandListener } from "./command/DiscordCommandListener";
import { QuarantinedUserExitEventListener } from "./event/QuarantinedUserExitEventListener";
import { CloseVerificationAttemptEventListener } from "./event/CloseVerificationAttemptEventListener";
import { VerificationListener } from "./event/VerificationListener";
import { UserJoinWelcomeEventListener } from "./event/UserJoinWelcomeEventListener";

const { MIXPANEL_TOKEN } = process.env;

export class Application {
  private readonly discordService: DiscordService;
  private readonly postgresDriver: PostgresDriver;

  public constructor() {
    this.discordService = new DiscordService();
    this.postgresDriver = new PostgresDriver();

    const repositoryRegistry = new RepositoryRegistry(this.postgresDriver);
    const verificationCodeService = new VerificationCodeService(repositoryRegistry, this.discordService);
    const analyticService = Mixpanel.init(MIXPANEL_TOKEN || "");

    this.bindListeners({ discordService: this.discordService, repositoryRegistry: repositoryRegistry, verificationCodeService, analyticService });
  }

  private bindListeners(dependencies: ListenerDependencies): void {
    new DiscordCommandListener(dependencies);
    new QuarantinedUserExitEventListener(dependencies);
    new CloseVerificationAttemptEventListener(dependencies);
    new VerificationListener(dependencies);
    new UserJoinWelcomeEventListener(dependencies);
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
