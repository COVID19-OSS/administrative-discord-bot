import { RepositoryRegistry } from "../../repository/RepositoryRegistry";
import { DiscordService } from "../../services/DiscordService";
import { VerificationCodeService } from "../../services/VerificationCodeService";

export interface CommandDependencies {
  repositoryRegistry: RepositoryRegistry;
  discordService: DiscordService;
  verificationCodeService: VerificationCodeService;
}
