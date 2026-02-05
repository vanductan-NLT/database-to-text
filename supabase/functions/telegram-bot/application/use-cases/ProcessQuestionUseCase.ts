/**
 * Process Question Use Case - Application Layer
 * Orchestrates the flow: Question → SQL → Execute → Format
 */
import { Query } from '../../domain/entities/Query.ts';
import { IAIProvider } from '../../domain/interfaces/IAIProvider.ts';
import { IDatabaseGateway } from '../../domain/interfaces/IDatabaseGateway.ts';
import { IMessageGateway } from '../../domain/interfaces/IMessageGateway.ts';
import { SqlValidator } from '../../domain/validators/SqlValidator.ts';
import { QuestionDTO, QueryResultDTO } from '../dtos/index.ts';
import { formatQueryResult } from '../../shared/formatters/TelegramFormatter.ts';

export class ProcessQuestionUseCase {
  constructor(
    private readonly aiProvider: IAIProvider,
    private readonly databaseGateway: IDatabaseGateway,
    private readonly messageGateway: IMessageGateway,
  ) {}

  async execute(dto: QuestionDTO): Promise<QueryResultDTO> {
    const query = new Query(dto.chatId, dto.question);

    // 1. Validate question
    if (!query.status.isValid) {
      return {
        success: false,
        error: query.status.errorMessage,
        formattedResponse: `❌ ${query.status.errorMessage}`,
      };
    }

    try {
      // 2. Send typing indicator
      await this.messageGateway.sendTypingAction(dto.chatId);

      // 3. Get schema context
      const schemaContext = await this.databaseGateway.getSchemaContext();

      // 4. Generate SQL using AI
      const aiResponse = await this.aiProvider.generateSql({
        schemaContext,
        question: query.question,
      });

      query.setSql(aiResponse.sql);

      // 5. Validate SQL (READ-only)
      const validation = SqlValidator.validate(aiResponse.sql);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          sql: aiResponse.sql,
          formattedResponse: `❌ ${validation.error}`,
        };
      }

      // 6. Execute query
      const result = await this.databaseGateway.executeQuery(aiResponse.sql);

      if (result.error) {
        return {
          success: false,
          error: result.error,
          sql: aiResponse.sql,
          formattedResponse: `❌ Query error: ${result.error}`,
        };
      }

      query.setResult(result.data);

      // 7. Format response
      const formattedResponse = formatQueryResult(result.data, result.rowCount);

      return {
        success: true,
        data: result.data,
        rowCount: result.rowCount,
        sql: aiResponse.sql,
        formattedResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      query.setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        formattedResponse: `❌ Error: ${errorMessage}`,
      };
    }
  }
}
