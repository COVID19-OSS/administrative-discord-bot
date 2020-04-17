import { Repository } from "./Repository";

import { Punishment } from "../definitions/entities/Punishment";
import { PunishmentType } from "../definitions/entities/PunishmentType";

export class PunishmentRepository extends Repository {
  public async create(offenderUserId: number, moderatorUserId: number, reason: string | null, punishmentType: PunishmentType, active: boolean, createdAt: Date, expiresAt?: Date): Promise<number> {
    const statement = "INSERT INTO punishments (offender_user_id, moderator_user_id, reason, punishment_type, active, created_at, expires_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING punishment_id";
    const result = await this.postgresDriver.query(statement, [offenderUserId, moderatorUserId, reason, punishmentType, active, createdAt, expiresAt || null ]);
    return result.rows[0]["punishment_id"];
  }

  public async getByOffenderDiscordId(offenderUserId: string, count: number): Promise<Array<Punishment>> {
    const statement = "SELECT p.* FROM punishments p INNER JOIN users u ON p.offender_user_id = u.user_id WHERE u.discord_id = $1 ORDER BY p.created_at DESC LIMIT $2";
    const result = await this.postgresDriver.query(statement, [offenderUserId, count]);
    return result.rows;
  }

  public async getActiveByPunishmentType(punishmentType: PunishmentType): Promise<Array<Punishment>> {
    const statement = "SELECT * FROM punishments WHERE punishment_type = $1 and active IS TRUE";
    const result = await this.postgresDriver.query(statement, [punishmentType]);
    return result.rows;
  }

  public async getActiveByPunishmentTypeAndUser(punishmentType: PunishmentType, offenderDiscordUserId: string): Promise<Array<Punishment>> {
    const statement = "SELECT p.* FROM punishments p INNER JOIN users u ON p.offender_user_id = u.user_id WHERE p.punishment_type = $1 AND p.active IS TRUE AND u.discord_id = $2";
    const result = await this.postgresDriver.query(statement, [punishmentType, offenderDiscordUserId]);
    return result.rows;
  }

  public async updateActive(punishmentId: number, active: boolean): Promise<void> {
    const statement = "UPDATE punishments SET active = $1 WHERE punishment_id = $2";
    await this.postgresDriver.query(statement, [active, punishmentId]);
  }
}
