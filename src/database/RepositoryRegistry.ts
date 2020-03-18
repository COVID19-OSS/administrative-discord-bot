import { PostgresDriver } from "../services/PostgresDriver";

import { UserRepository } from "./UserRepository";
import { QuarantineRepository } from "./QuarantineRepository";

export class RepositoryRegistry {
  public readonly userRepository: UserRepository;
  public readonly quarantineRepository: QuarantineRepository;

  constructor(postgresDriver: PostgresDriver) {
    this.userRepository = new UserRepository(postgresDriver);
    this.quarantineRepository = new QuarantineRepository(postgresDriver);
  }
}