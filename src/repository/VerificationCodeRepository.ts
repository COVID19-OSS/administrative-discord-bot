import { Repository } from "./Repository";
import { VerificationCode } from "../definitions/entities/VerificationCode";

export class VerificationCodeRepository extends Repository {
  public async create(code: string, createdAt: Date, validTo: Date): Promise<number> {
    const statement = "INSERT INTO verification_codes (code, created_at, valid_to) VALUES ($1, $2, $3) RETURNING verification_code_id";
    const result = await this.postgresDriver.query(statement, [code, createdAt, validTo]);
    return result.rows[0]["verification_code_id"];
  }

  public async getByCode(code: string): Promise<Array<VerificationCode>> {
    const statement = "SELECT * FROM verification_codes WHERE code = $1";
    const result = await this.postgresDriver.query(statement, [code]);
    return result.rows;
  }

  public async getLastCodes(count: number): Promise<Array<VerificationCode>> {
    const statement = "SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT $1";
    const result = await this.postgresDriver.query(statement, [count]);
    return result.rows;
  }

  public async updateValidTo(verificationCodeId: number, validTo: Date): Promise<void> {
    const statement = "UPDATE verification_codes SET valid_to = $1 WHERE verification_code_id = $2";
    await this.postgresDriver.query(statement, [validTo, verificationCodeId]);
  }
}
