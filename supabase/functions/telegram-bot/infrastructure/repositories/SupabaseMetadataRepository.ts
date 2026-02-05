/**
 * Metadata Repository Implementation - Infrastructure Layer
 * Uses Supabase to store and search table metadata
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IMetadataRepository, TableMetadata } from '../../domain/interfaces/IMetadataRepository.ts';

export class SupabaseMetadataRepository implements IMetadataRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getIndexedTableNames(): Promise<string[]> {
    const { data, error } = await this.client
      .from('bot_table_metadata')
      .select('table_name');
    
    if (error) throw error;
    return (data || []).map(row => row.table_name);
  }

  async saveMetadata(metadata: TableMetadata[]): Promise<void> {
    const records = metadata.map(m => ({
      table_name: m.tableName,
      keywords: m.keywords,
      description: m.description,
      sample_columns: m.sampleColumns,
      relationships: m.relationships,
    }));

    const { error } = await this.client
      .from('bot_table_metadata')
      .upsert(records, { onConflict: 'table_name' });

    if (error) throw new Error(`Failed to save metadata: ${error.message}`);
  }

  async searchRelevantTables(question: string): Promise<TableMetadata[]> {
    // Phase 2 implementation: Keyword matching
    // We fetch all active metadata and filter by keywords locally for simplicity in MVP
    // In a massive DB, this would use Postgres full-text search or Vector search
    const { data, error } = await this.client
      .from('bot_table_metadata')
      .select('*');

    if (error) throw new Error(`Failed to search metadata: ${error.message}`);

    const q = question.toLowerCase();
    
    // Simple relevance scoring: count how many keywords match the question
    const scored = data.map(table => {
      let score = 0;
      
      // Match keywords
      table.keywords.forEach((k: string) => {
        if (q.includes(k.toLowerCase())) score += 2;
      });

      // Match table name
      if (q.includes(table.table_name.toLowerCase())) score += 5;
      
      return { ...table, score };
    });

    // Sort by score and take top 5
    return scored
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(t => ({
        tableName: t.table_name,
        keywords: t.keywords,
        description: t.description,
        sampleColumns: t.sample_columns,
        relationships: t.relationships,
      }));
  }
}
