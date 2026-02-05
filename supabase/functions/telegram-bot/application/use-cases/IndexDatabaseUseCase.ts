/**
 * Index Database Use Case - Application Layer (THE RELATIVE TRAINING)
 * Scans real database metadata and trains AI to understand it.
 */
import { IAIProvider } from '../../domain/interfaces/IAIProvider.ts';
import { IMetadataRepository, TableMetadata } from '../../domain/interfaces/IMetadataRepository.ts';
import { IDatabaseGateway } from '../../domain/interfaces/IDatabaseGateway.ts';

export class IndexDatabaseUseCase {
  constructor(
    private readonly aiProvider: IAIProvider,
    private readonly databaseGateway: IDatabaseGateway,
    private readonly metadataRepo: IMetadataRepository,
  ) {}

  async execute(): Promise<void> {
    console.log('🚀 Starting LIVE Database Training...');
    
    // 1. Fetch Real Objects from Database
    const tables = await this.databaseGateway.getLiveSchema();
    console.log(`📡 Found ${tables.length} tables in public schema.`);
    
    // Safety check: Filter out metadata/logs tables from training themselves
    const filteredTables = tables.filter(t => !['bot_table_metadata', 'bot_query_audit_log'].includes(t.tableName));
    console.log(`🧠 Tables to analyze: ${filteredTables.length}`);

    const metadatas: TableMetadata[] = [];

    for (const table of filteredTables) {
      console.log(`✨ AI Training for table: ${table.tableName}...`);

      // 2. Ask AI to analyze the LIVE schema data
      const aiResponse = await this.aiProvider.generateSql({
        schemaContext: "You are a professional Data Analyst helping to train a SQL Bot.",
        question: `Based on the following real database metadata, generate:
        1. A human-friendly description of what this table is for.
        2. A list of 10 keywords/synonyms that users might use when asking about this data.
        
        TABLE: ${table.tableName}
        COLUMNS: ${table.columns.join(', ')}
        EXISTING COMMENT: ${table.description || 'none'}
        
        RESPONSE FORMAT (JSON ONLY):
        { "description": "...", "keywords": ["...", "..."] }`,
      });

      try {
        const aiData = JSON.parse(aiResponse.sql);
        metadatas.push({
          tableName: table.tableName,
          description: aiData.description,
          keywords: aiData.keywords,
          sampleColumns: table.columns,
          relationships: [], 
          fullSchema: `TABLE ${table.tableName} (${table.columns.join(', ')})`,
        });
      } catch (e) {
        console.error(`❌ Failed to train on table ${table.tableName}`, e);
      }
    }

    // 3. Save to Metadata Table
    await this.metadataRepo.saveMetadata(metadatas);
    console.log(`✅ Training Complete. ${metadatas.length} tables indexed in Metadata Store.`);
  }
}
