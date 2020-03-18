import { Repository } from "./Repository";

export class QuarantineRepository extends Repository {
  public async create(offenderUserId: number, moderatorUserId: number, reason?: string): Promise<number> {
    const statement = "INSERT INTO quarantines (offender_user_id, moderator_user_id, reason, created_at) " +
      "VALUES ($1, $2, $3, timezone('utc', now())) RETURNING quarantine_id";
    const values = [offenderUserId, moderatorUserId, reason || null];
    const result = await this.postgresDriver.query(statement, values);
    return result.rows[0]["quarantine_id"];
  }
}