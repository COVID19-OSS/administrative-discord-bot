import { Pool, PoolConfig, QueryResult } from "pg";

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

type AcceptedValues = string | number | boolean | null | Buffer;

export class PostgresDriver {

  private readonly pool: Pool;

  public constructor() {
    this.pool = new Pool(this.getConfig());
  }

  public async start(): Promise<void> {
    await this.testConnection();
  }

  public async stop(): Promise<void> {
    await this.pool.end();
  }

  public async query(statement: string, values?: Array<AcceptedValues>): Promise<QueryResult> {
    if (!this.pool) throw Error("Connection to database has not been instantiated");
    const client = await this.pool.connect();
    let result: QueryResult;
    try {
      result = await client.query(statement, values);
    } finally {
      client.release();
    }
    return result;
  }

  private async testConnection(): Promise<void> {
    await this.query("SELECT NOW()");
  }

  private getConfig(): PoolConfig {
    return {
      database: DB_NAME,
      host: DB_HOST,
      password: DB_PASS,
      port: Number(DB_PORT),
      user: DB_USER,
    };
  }

}
