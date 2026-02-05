/**
 * Telegram Bot Webhook Handler - Entry Point
 * Supabase Edge Function that handles Telegram webhook updates
 */
import { createContainer } from './infrastructure/config/container.ts';

// Deno global declarations for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

// Telegram Update type
interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    message_id: number;
  };
}

// Create container with environment variables
function getContainer() {
  return createContainer({
    telegramBotToken: Deno.env.get('TELEGRAM_BOT_TOKEN') || '',
    geminiApiKey: Deno.env.get('GEMINI_API_KEY') || '',
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  });
}

Deno.serve(async (req: Request) => {
  console.log(`Received ${req.method} request to /telegram-bot`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const bodyText = await req.text();
    console.log('Request body:', bodyText);
    
    if (!bodyText) {
      return new Response(JSON.stringify({ error: 'Empty body' }), { status: 400 });
    }

    const update: TelegramUpdate = JSON.parse(bodyText);
    
    // Ignore non-message updates
    if (!update.message?.text) {
      console.log('Ignored non-text update');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { chat, text } = update.message;
    console.log(`Processing question from chat ${chat.id}: ${text}`);

    const container = getContainer();

    // Process the question
    const result = await container.processQuestionUseCase.execute({
      chatId: chat.id,
      question: text,
    });

    console.log('Process result:', JSON.stringify(result));

    // Send response to Telegram
    await container.telegramAdapter.sendMessage({
      chatId: chat.id,
      text: result.formattedResponse,
      parseMode: 'HTML',
    });

    console.log('Successfully sent message to Telegram');

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('CRITICAL Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
