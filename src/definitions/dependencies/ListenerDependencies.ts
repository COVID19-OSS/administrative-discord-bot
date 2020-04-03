import { Mixpanel } from "mixpanel";

import { RepositoryRegistry } from "../../repository/RepositoryRegistry";
import { DiscordService } from "../../services/DiscordService";
import { VerificationCodeService } from "../../services/VerificationCodeService";

export interface ListenerDependencies {
  repositoryRegistry: RepositoryRegistry;
  discordService: DiscordService;
  verificationCodeService: VerificationCodeService;
  analyticService: Mixpanel;
}
