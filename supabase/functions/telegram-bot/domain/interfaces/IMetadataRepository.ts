/**
 * Metadata Table Entity - Domain Layer
 * Matches user's database schema
 */
export interface TableMetadata {
  tableName: string;
  keywords: string[];
  description: string;
  sampleColumns: string[];
  relationships: string[];
  fullSchema?: string; // Added back to fix use case error
}

export interface IMetadataRepository {
  /**
   * Get list of tables already indexed
   */
  getIndexedTableNames(): Promise<string[]>;

  /**
   * Save or update table metadata (bulk)
   */
  saveMetadata(metadata: TableMetadata[]): Promise<void>;

  /**
   * Search for tables relevant to a natural language question
   */
  searchRelevantTables(question: string): Promise<TableMetadata[]>;
}
