/**
 * Supabase Adapter - Infrastructure Layer
 * Implements IDatabaseGateway using Supabase client
 * Uses SERVICE ROLE KEY to bypass RLS
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabaseGateway, QueryResult, TableDefinition } from '../../domain/interfaces/IDatabaseGateway.ts';
import { SCHEMA_CONTEXT } from '../config/schema-context.ts';

export class SupabaseAdapter implements IDatabaseGateway {
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey);
  }

  async executeQuery(sql: string): Promise<QueryResult> {
    try {
      // Use Postgres function for safe execution
      const { data, error } = await this.client.rpc('execute_bot_query', {
        query_text: sql
      });

      if (error) {
        return {
          data: [],
          rowCount: 0,
          error: error.message,
        };
      }

      const resultData = data || [];
      return {
        data: resultData,
        rowCount: Array.isArray(resultData) ? resultData.length : 0,
      };
    } catch (error) {
      return {
        data: [],
        rowCount: 0,
        error: error instanceof Error ? error.message : 'Query execution failed',
      };
    }
  }

  async getSchemaContext(): Promise<string> {
    return SCHEMA_CONTEXT;
  }

  /**
   * Introspection: Fetch real-time schema from Postgres
   */
  async getLiveSchema(): Promise<TableDefinition[]> {
    // This query gets all tables in 'public' schema, their columns, and their comments
    const query = `
      SELECT 
        t.table_name as "tableName",
        array_agg(DISTINCT c.column_name::text) as "columns",
        obj_description(pgc.oid, 'pg_class') as "description",
        COALESCE(
          (
            SELECT json_agg(relations)
            FROM (
              SELECT 
                kcu.column_name as "column",
                ccu.table_name as "referencedTable",
                ccu.column_name as "referencedColumn"
              FROM information_schema.key_column_usage kcu
              JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
              JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
              WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_name = t.table_name
            ) relations
          ),
          '[]'::json
        ) as "relationships"
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      JOIN pg_class pgc ON t.table_name = pgc.relname
      JOIN pg_namespace pgn ON pgc.relnamespace = pgn.oid AND pgn.nspname = t.table_schema
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name, pgc.oid;
    `;

    // We use the rpc bypass to execute this raw SQL
    // You'll need to update your 'execute_bot_query' to allow this or create a new RPC
    const { data, error } = await this.client.rpc('execute_bot_query', {
      query_text: query.trim() // Xóa khoảng trắng ở đầu và cuối
    });

    if (error) throw new Error(`Schema introspection failed: ${error.message}`);
    return data as TableDefinition[];
  }
}
