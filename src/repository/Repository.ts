import { PostgresDriver } from "../services/PostgresDriver";

export class Repository {
  constructor(protected readonly postgresDriver: PostgresDriver) {}
}