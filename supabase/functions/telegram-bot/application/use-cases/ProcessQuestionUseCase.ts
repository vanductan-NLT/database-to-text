/**
 * Process Question Use Case - Application Layer
 * Updated with Dynamic Context Lookup (Phase 2)
 */
import { Query } from '../../domain/entities/Query.ts';
import { IAIProvider } from '../../domain/interfaces/IAIProvider.ts';
import { IDatabaseGateway } from '../../domain/interfaces/IDatabaseGateway.ts';
import { IMessageGateway } from '../../domain/interfaces/IMessageGateway.ts';
import { IMetadataRepository } from '../../domain/interfaces/IMetadataRepository.ts';
import { SqlValidator } from '../../domain/validators/SqlValidator.ts';
import { QuestionDTO, QueryResultDTO } from '../dtos/index.ts';
import { formatQueryResult } from '../../shared/formatters/TelegramFormatter.ts';

export class ProcessQuestionUseCase {
  constructor(
    private readonly aiProvider: IAIProvider,
    private readonly databaseGateway: IDatabaseGateway,
    private readonly messageGateway: IMessageGateway,
    private readonly metadataRepo: IMetadataRepository,
  ) {}

  async execute(dto: QuestionDTO): Promise<QueryResultDTO> {
    const query = new Query(dto.chatId, dto.question);

    if (!query.status.isValid) {
      return {
        success: false,
        error: query.status.errorMessage,
        formattedResponse: `❌ ${query.status.errorMessage}`,
      };
    }

    try {
      await this.messageGateway.sendTypingAction(dto.chatId);

      // --- PHASE 2: SMART CONTEXT LOOKUP ---
      // 1. Find relevant tables based on keywords in the question
      const relevantTables = await this.metadataRepo.searchRelevantTables(dto.question);
      
      let dynamicSchemaContext = "";
      if (relevantTables.length > 0) {
        dynamicSchemaContext = relevantTables.map(t => 
          `TABLE: ${t.tableName}\nDESCRIPTION: ${t.description}\nCOLUMNS: ${t.sampleColumns.join(', ')}\nRELATIONS: ${t.relationships.join(', ')}\nSCHEMA: ${t.fullSchema}\n`
        ).join("\n---\n");
      } else {
        // Fallback to minimal fixed context if no tables matched
        dynamicSchemaContext = await this.databaseGateway.getSchemaContext();
      }

      // 2. Generate SQL using the dynamic context
      const aiResponse = await this.aiProvider.generateSql({
        schemaContext: dynamicSchemaContext,
        question: query.question,
      });

      query.setSql(aiResponse.sql);

      // 3. Validate SQL (READ-only)
      const validation = SqlValidator.validate(aiResponse.sql);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          sql: aiResponse.sql,
          formattedResponse: `❌ ${validation.error}`,
        };
      }

      // 4. Execute query
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

      // --- AUDIT LOGGING (Placeholder for User's Table 2) ---
      // In a full implementation, we would call an AuditRepository here

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
