/**
 * Index Database Use Case - Application Layer
 * "Cuốn chiếu" mode: Trains 5 tables per request to avoid Timeouts and Rate Limits.
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

  async execute(): Promise<{ trained: number; remaining: number; debug?: any }> {
    console.log('🚀 Checking Training Status...');
    let lastRawResponse = '';
    
    // 1. Get Live Tables vs Already Indexed Tables
    const allTables = await this.databaseGateway.getLiveSchema();
    const indexedTableNames = await this.metadataRepo.getIndexedTableNames();

    // 2. Filter tables that NEED training
    const tablesToTrain = allTables.filter(t => 
      !indexedTableNames.includes(t.tableName) && 
      !['bot_table_metadata', 'bot_query_audit_log'].includes(t.tableName)
    );

    if (tablesToTrain.length === 0) {
      console.log('✅ All tables are already trained!');
      return { trained: 0, remaining: 0 };
    }

    // 3. Take only the first 5 tables to avoid Rate Limit and Timeout
    const batchSize = 5;
    const batch = tablesToTrain.slice(0, batchSize);
    console.log(`🧠 Training batch of ${batch.length} tables. Remaining: ${tablesToTrain.length - batch.length}`);

    const metadatas: TableMetadata[] = [];

    for (const table of batch) {
      console.log(`✨ AI Analyzing: ${table.tableName}...`);

      try {
        const aiResponse = await this.aiProvider.generateSql({
          schemaContext: "Professional Data Analyst Training Mode.",
          question: `Analyze this DB table and return a JSON object with this exact structure:
          { 
            "description": "Short business explanation of this table", 
            "keywords": ["synonym1", "synonym2", "related_term"],
            "relationships": ["connected to table X via column Y", "related to Z"]
          }
          
          TABLE NAME: ${table.tableName}
          COLUMNS: ${table.columns.join(', ')}
          FOREIGN KEYS: ${JSON.stringify(table.relationships)}
          
          RETURN ONLY THE JSON BLOCK.`,
        });

        lastRawResponse = aiResponse.sql;
        const aiData = JSON.parse(aiResponse.sql);
        metadatas.push({
          tableName: table.tableName,
          description: aiData.description,
          keywords: aiData.keywords,
          sampleColumns: table.columns,
          relationships: aiData.relationships || [], 
          fullSchema: `TABLE ${table.tableName} (${table.columns.join(', ')}) | RELATIONS: ${JSON.stringify(table.relationships)}`,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`❌ Failed table ${table.tableName}:`, errorMessage);
        lastRawResponse = `ERROR: ${errorMessage}. RAW: ${lastRawResponse}`;
      }
    }

    // 4. Save this batch
    if (metadatas.length > 0) {
      await this.metadataRepo.saveMetadata(metadatas);
    }

    return { 
      trained: metadatas.length, 
      remaining: tablesToTrain.length - metadatas.length,
      debug: lastRawResponse
    };
  }
}
