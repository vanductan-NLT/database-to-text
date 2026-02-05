/**
 * Telegram Adapter - Infrastructure Layer
 * Implements IMessageGateway using Telegram Bot API
 */
import { IMessageGateway, SendMessageRequest } from '../../domain/interfaces/IMessageGateway.ts';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export class TelegramAdapter implements IMessageGateway {
  private readonly apiUrl: string;

  constructor(botToken: string) {
    this.apiUrl = `${TELEGRAM_API_BASE}${botToken}`;
  }

  async sendMessage(request: SendMessageRequest): Promise<void> {
    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: request.chatId,
        text: request.text,
        parse_mode: request.parseMode || 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${error}`);
    }
  }

  async sendTypingAction(chatId: number): Promise<void> {
    await fetch(`${this.apiUrl}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing',
      }),
    });
  }
}
