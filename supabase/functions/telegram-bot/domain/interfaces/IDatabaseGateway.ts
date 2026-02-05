/**
 * Database Gateway Interface - Domain Layer
 * Abstraction for database operations
 */
export interface TableDefinition {
  tableName: string;
  columns: string[];
  description?: string;
}

export interface QueryResult {
  readonly data: unknown[];
  readonly rowCount: number;
  readonly error?: string;
}

export interface IDatabaseGateway {
  /**
   * Execute a READ-only SQL query
   */
  executeQuery(sql: string): Promise<QueryResult>;

  /**
   * Get database schema for AI context
   */
  getSchemaContext(): Promise<string>;

  /**
   * Fetch live schema definitions from Database
   */
  getLiveSchema(): Promise<TableDefinition[]>;
}
