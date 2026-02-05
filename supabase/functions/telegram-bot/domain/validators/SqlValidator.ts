/**
 * SQL Validator - Domain Layer
 * Validates SQL queries for safety (READ-only)
 */

const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
];

export interface ValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

export class SqlValidator {
  /**
   * Validate SQL is READ-only (SELECT statements only)
   */
  static validate(sql: string): ValidationResult {
    if (!sql || !sql.trim()) {
      return { isValid: false, error: 'SQL cannot be empty' };
    }

    const upperSql = sql.toUpperCase().trim();

    // Must start with SELECT or WITH (for CTEs)
    if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('WITH')) {
      return { isValid: false, error: 'Only SELECT queries are allowed' };
    }

    // Check for forbidden keywords
    for (const keyword of FORBIDDEN_KEYWORDS) {
      // Use word boundary to avoid false positives (e.g., "SELECTED")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sql)) {
        return { isValid: false, error: `Forbidden keyword: ${keyword}` };
      }
    }

    return { isValid: true };
  }
}
