/**
 * Gemini Adapter - Infrastructure Layer
 * Implements IAIProvider using Google Gemini 2.5 Flash
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
  private readonly model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent SQL
        maxOutputTokens: 1024,
      },
    });
  }

  async generateSql(request: GenerateSqlRequest): Promise<GenerateSqlResponse> {
    console.log(`Generating SQL for question: ${request.question}`);
    const prompt = `${SYSTEM_PROMPT}

DATABASE SCHEMA:
${request.schemaContext}

USER QUESTION: ${request.question}

SQL QUERY:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      let sql = response.text().trim();
      console.log('Gemini raw response text length:', sql.length);


    // Clean up: remove markdown code blocks if present
    if (sql.startsWith('```sql')) {
      sql = sql.replace(/^```sql\n?/, '').replace(/\n?```$/, '');
    } else if (sql.startsWith('```')) {
      sql = sql.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    return { sql: sql.trim() };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
}

