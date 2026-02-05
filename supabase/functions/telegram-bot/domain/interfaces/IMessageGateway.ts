/**
 * Message Gateway Interface - Domain Layer
 * Abstraction for messaging platforms (Telegram, Slack, etc.)
 */
export interface SendMessageRequest {
  readonly chatId: number;
  readonly text: string;
  readonly parseMode?: 'HTML' | 'MarkdownV2';
}

export interface IMessageGateway {
  /**
   * Send a message to the user
   */
  sendMessage(request: SendMessageRequest): Promise<void>;

  /**
   * Send typing indicator
   */
  sendTypingAction(chatId: number): Promise<void>;
}
