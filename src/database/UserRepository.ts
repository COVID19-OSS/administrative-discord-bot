import { Repository } from "./Repository";
import { User } from "../definitions/entities/User";

export class UserRepository extends Repository {
  public async create(payload: { discordUserId: string }): Promise<number> {
    const statement = "INSERT INTO users (discord_id, created_at) VALUES ($1, timezone('utc', now())) RETURNING user_id";
    const result = await this.postgresDriver.query(statement, [payload.discordUserId]);
    return result.rows[0]["user_id"];
  }

  public async getOffenderByDiscordChannel(discordChannelId: string): Promise<User|null> {
    const statement = "SELECT u.* FROM users u INNER JOIN quarantines q on u.user_id = q.offender_user_id WHERE q.channel_id = $1";
    const result = await this.postgresDriver.query(statement, [discordChannelId]);
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  public async getByDiscordId(discordId: string): Promise<User|null> {
    const statement = "SELECT user_id, discord_id, created_at FROM users WHERE discord_id = $1";
    const result = await this.postgresDriver.query(statement, [discordId]);
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  public async getByUserId(userId: number): Promise<User|null> {
    const statement = "SELECT user_id, discord_id, created_at FROM users WHERE user_id = $1";
    const result = await this.postgresDriver.query(statement, [userId]);
    return result.rowCount > 0 ? result.rows[0] : null;
  }
}