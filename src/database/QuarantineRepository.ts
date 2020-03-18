import { Repository } from "./Repository";

export class QuarantineRepository extends Repository {
  public async create(offenderUserId: number, moderatorUserId: number, reason?: string, channelId?: string): Promise<number> {
    const statement = "INSERT INTO quarantines (offender_user_id, moderator_user_id, reason, channel_id, created_at) " +
      "VALUES ($1, $2, $3, $4, timezone('utc', now())) RETURNING quarantine_id";
    const values = [offenderUserId, moderatorUserId, reason || null, channelId || null];
    const result = await this.postgresDriver.query(statement, values);
    return result.rows[0]["quarantine_id"];
  }
  public async updateChannelId(quarantineId: number, channelId: string): Promise<void> {
    const statement = "UPDATE quarantines SET channel_id = $1 WHERE quarantine_id = $2";
    await this.postgresDriver.query(statement, [channelId, quarantineId]);
  }
}