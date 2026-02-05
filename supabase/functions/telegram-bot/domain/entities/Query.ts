/**
 * Query Entity - Domain Layer
 * Represents a user query and its lifecycle
 */
export interface QueryStatus {
  readonly isValid: boolean;
  readonly errorMessage?: string;
}

export class Query {
  public readonly id: string;
  public readonly question: string;
  public readonly chatId: number;
  public readonly createdAt: Date;

  private _generatedSql?: string;
  private _result?: unknown;
  private _status: QueryStatus = { isValid: true };

  constructor(chatId: number, question: string) {
    this.id = crypto.randomUUID();
    this.chatId = chatId;
    this.question = question.trim();
    this.createdAt = new Date();

    if (!this.question) {
      this._status = { isValid: false, errorMessage: 'Question cannot be empty' };
    }
  }

  get generatedSql(): string | undefined {
    return this._generatedSql;
  }

  get result(): unknown {
    return this._result;
  }

  get status(): QueryStatus {
    return this._status;
  }

  setSql(sql: string): void {
    this._generatedSql = sql;
  }

  setResult(result: unknown): void {
    this._result = result;
  }

  setError(message: string): void {
    this._status = { isValid: false, errorMessage: message };
  }
}
