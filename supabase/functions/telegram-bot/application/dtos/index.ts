/**
 * Question DTO - Application Layer
 * Data transfer object for incoming questions
 */
export interface QuestionDTO {
  readonly chatId: number;
  readonly question: string;
  readonly messageId?: number;
}

/**
 * Query Result DTO - Application Layer
 * Data transfer object for query results
 */
export interface QueryResultDTO {
  readonly success: boolean;
  readonly data?: unknown[];
  readonly rowCount?: number;
  readonly sql?: string;
  readonly error?: string;
  readonly formattedResponse: string;
}
