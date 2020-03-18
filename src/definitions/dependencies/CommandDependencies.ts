import { RepositoryRegistry } from "../../database/RepositoryRegistry";
import { DiscordService } from "../../services/DiscordService";

export interface CommandDependencies {
  repositoryRegistry: RepositoryRegistry;
  discordService: DiscordService;
}