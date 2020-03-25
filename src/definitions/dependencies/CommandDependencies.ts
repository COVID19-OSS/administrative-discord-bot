import { RepositoryRegistry } from "../../repository/RepositoryRegistry";
import { DiscordService } from "../../services/DiscordService";

export interface CommandDependencies {
  repositoryRegistry: RepositoryRegistry;
  discordService: DiscordService;
}
