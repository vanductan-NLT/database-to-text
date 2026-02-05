/**
 * Dependency Injection Container - Infrastructure Config
 */
import { createClient } from '@supabase/supabase-js';
import { ProcessQuestionUseCase } from '../../application/use-cases/ProcessQuestionUseCase.ts';
import { IndexDatabaseUseCase } from '../../application/use-cases/IndexDatabaseUseCase.ts';
import { GeminiAdapter } from '../adapters/GeminiAdapter.ts';
import { SupabaseAdapter } from '../adapters/SupabaseAdapter.ts';
import { TelegramAdapter } from '../adapters/TelegramAdapter.ts';
import { SupabaseMetadataRepository } from '../repositories/SupabaseMetadataRepository.ts';

export interface AppConfig {
  telegramBotToken: string;
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export interface Container {
  processQuestionUseCase: ProcessQuestionUseCase;
  indexDatabaseUseCase: IndexDatabaseUseCase;
  telegramAdapter: TelegramAdapter;
  metadataRepo: SupabaseMetadataRepository;
}

export function createContainer(config: AppConfig): Container {
  // Shared Supabase Client
  const supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

  // Adapters & Repositories
  const geminiAdapter = new GeminiAdapter(config.geminiApiKey);
  const supabaseAdapter = new SupabaseAdapter(config.supabaseUrl, config.supabaseServiceRoleKey);
  const telegramAdapter = new TelegramAdapter(config.telegramBotToken);
  const metadataRepo = new SupabaseMetadataRepository(supabaseClient);

  // Use Cases
  const processQuestionUseCase = new ProcessQuestionUseCase(
    geminiAdapter,
    supabaseAdapter,
    telegramAdapter,
    metadataRepo,
  );

  const indexDatabaseUseCase = new IndexDatabaseUseCase(
    geminiAdapter,
    supabaseAdapter,
    metadataRepo,
  );

  return {
    processQuestionUseCase,
    indexDatabaseUseCase,
    telegramAdapter,
    metadataRepo,
  };
}
