/**
 * Dependency Injection Container - Infrastructure Config
 * Wires up all dependencies following Clean Architecture
 */
import { ProcessQuestionUseCase } from '../../application/use-cases/ProcessQuestionUseCase.ts';
import { GeminiAdapter } from '../adapters/GeminiAdapter.ts';
import { SupabaseAdapter } from '../adapters/SupabaseAdapter.ts';
import { TelegramAdapter } from '../adapters/TelegramAdapter.ts';

export interface AppConfig {
  telegramBotToken: string;
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export interface Container {
  processQuestionUseCase: ProcessQuestionUseCase;
  telegramAdapter: TelegramAdapter;
}

/**
 * Create the dependency container with all wired dependencies
 */
export function createContainer(config: AppConfig): Container {
  // Create adapters
  const geminiAdapter = new GeminiAdapter(config.geminiApiKey);
  const supabaseAdapter = new SupabaseAdapter(config.supabaseUrl, config.supabaseServiceRoleKey);
  const telegramAdapter = new TelegramAdapter(config.telegramBotToken);

  // Create use cases with injected dependencies
  const processQuestionUseCase = new ProcessQuestionUseCase(
    geminiAdapter,
    supabaseAdapter,
    telegramAdapter,
  );

  return {
    processQuestionUseCase,
    telegramAdapter,
  };
}
