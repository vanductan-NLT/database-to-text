/**
 * Indexer Script - Infrastructure
 * Allows manual triggering of the indexing process
 */
declare const Deno: any;

import { createContainer } from './infrastructure/config/container.ts';

async function runIndexer() {
  const container = createContainer({
    telegramBotToken: Deno.env.get('TELEGRAM_BOT_TOKEN') || '',
    geminiApiKey: Deno.env.get('GEMINI_API_KEY') || '',
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  });

  try {
    // Run live indexing using introspection
    await container.indexDatabaseUseCase.execute();
    
    console.log('✅ Indexing finished successfully!');
  } catch (error) {
    console.error('❌ Indexing failed:', error);
  }
}

// Check if run from CLI
if (import.meta.main) {
  runIndexer();
}
