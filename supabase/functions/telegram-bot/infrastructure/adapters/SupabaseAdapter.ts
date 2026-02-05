/**
 * Supabase Adapter - Infrastructure Layer
 * Implements IDatabaseGateway using Supabase client
 * Uses SERVICE ROLE KEY to bypass RLS
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabaseGateway, QueryResult } from '../../domain/interfaces/IDatabaseGateway.ts';
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
}
