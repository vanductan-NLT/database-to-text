/**
 * Gemini Adapter - Infrastructure Layer
 * Implements IAIProvider using Google Gemini 1.5 Flash
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider, GenerateSqlRequest, GenerateSqlResponse } from '../../domain/interfaces/IAIProvider.ts';

const SYSTEM_PROMPT = `You are a PostgreSQL expert. Given a database schema and a natural language question, generate a valid SELECT SQL query.

RULES:
1. ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Return ONLY the SQL query, no explanations
3. Use proper PostgreSQL syntax
4. If the question cannot be answered with a query, respond with: SELECT 'Cannot answer this question' AS error
5. Limit results to 100 rows maximum unless specified
6. Use table aliases for readability

IMPORTANT: Return ONLY the SQL query, nothing else.`;

export class GeminiAdapter implements IAIProvider {
  private readonly model: any;
  private lastRequestTime: number = 0;
  private readonly delayMs: number = 6000; // Increased to 6s for better safety (10 RPM)

  constructor(apiKey: string) {
    console.log('🤖 Initializing GeminiAdapter with STABLE model: gemini-2.0-flash');
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async generateSql(request: GenerateSqlRequest): Promise<GenerateSqlResponse> {
    // --- THROTTLE PROTECTION ---
    const now = Date.now();
    const waitTime = this.delayMs - (now - this.lastRequestTime);
    if (waitTime > 0) {
      console.log(`⏳ Throttling: waiting ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
    this.lastRequestTime = Date.now();

    const isJsonRequest = request.question.includes('JSON');
    
    const prompt = isJsonRequest 
      ? `CONTEXT: ${request.schemaContext}\n\nTASK: ${request.question}`
      : `${SYSTEM_PROMPT}\n\nDATABASE SCHEMA:\n${request.schemaContext}\n\nUSER QUESTION: ${request.question}\n\nSQL QUERY:`;

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    let sql = response.text().trim();

    // Clean up: remove markdown code blocks if present (sql, json, or generic)
    sql = sql.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');

    return { sql: sql.trim() };
  }
}
