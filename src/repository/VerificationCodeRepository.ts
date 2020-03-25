import { Repository } from "./Repository";
import { VerificationCode } from "../definitions/entities/VerificationCode";

export class VerificationCodeRepository extends Repository {
  public async create(code: string, validTo: Date): Promise<number> {
    const statement = "INSERT INTO verification_codes (code, created_at, valid_to) VALUES ($1, NOW(), $2) RETURNING verification_code_id";
    const result = await this.postgresDriver.query(statement, [code, validTo]);
    return result.rows[0]["verification_code_id"];
  }
  public async getByCode(code: string): Promise<Array<VerificationCode>> {
    const statement = "SELECT * FROM verification_codes WHERE code = $1";
    const result = await this.postgresDriver.query(statement, [code]);
    return result.rows;
  }
}
