/**
 * AI Provider Interface - Domain Layer
 * Abstraction for AI/LLM services (Gemini, OpenAI, etc.)
 */
export interface GenerateSqlRequest {
  readonly schemaContext: string;
  readonly question: string;
}

export interface GenerateSqlResponse {
  readonly sql: string;
  readonly explanation?: string;
}

export interface IAIProvider {
  /**
   * Generate SQL from natural language question
   */
  generateSql(request: GenerateSqlRequest): Promise<GenerateSqlResponse>;
}
