import { PostgresDriver } from "../services/PostgresDriver";

import { UserRepository } from "./UserRepository";
import { PunishmentRepository } from "./PunishmentRepository";
import { QuarantineRepository } from "./QuarantineRepository";
import { VerificationCodeRepository } from "./VerificationCodeRepository";

export class RepositoryRegistry {
  public readonly userRepository: UserRepository;
  public readonly punishmentRepository: PunishmentRepository;
  public readonly quarantineRepository: QuarantineRepository;
  public readonly verificationCodeRepository: VerificationCodeRepository;

  constructor(postgresDriver: PostgresDriver) {
    this.userRepository = new UserRepository(postgresDriver);
    this.punishmentRepository = new PunishmentRepository(postgresDriver);
    this.quarantineRepository = new QuarantineRepository(postgresDriver);
    this.verificationCodeRepository = new VerificationCodeRepository(postgresDriver);
  }
}
