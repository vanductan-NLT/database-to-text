/**
 * Telegram Formatter - Shared Layer
 * Formats query results for Telegram messages
 */

const MAX_MESSAGE_LENGTH = 4000; // Telegram limit is 4096

/**
 * Format query result for Telegram display
 */
export function formatQueryResult(data: unknown[], rowCount: number): string {
  if (!data || data.length === 0) {
    return '📭 <b>No results found</b>';
  }

  const lines: string[] = [];
  lines.push(`📊 <b>Results: ${rowCount} row${rowCount !== 1 ? 's' : ''}</b>\n`);

  // Single value result (count, sum, etc.)
  if (data.length === 1 && Object.keys(data[0] as object).length === 1) {
    const value = Object.values(data[0] as object)[0];
    const key = Object.keys(data[0] as object)[0];
    lines.push(`<b>${key}:</b> ${value}`);
    return lines.join('\n');
  }

  // Table format for multiple results
  const headers = Object.keys(data[0] as object);
  
  // Build table header
  lines.push('<pre>');
  lines.push(headers.map(h => truncate(h, 15)).join(' | '));
  lines.push('-'.repeat(Math.min(headers.length * 18, 60)));

  // Build table rows (limit to 20 rows)
  const displayData = data.slice(0, 20);
  for (const row of displayData) {
    const values = headers.map(h => {
      const val = (row as Record<string, unknown>)[h];
      return truncate(formatValue(val), 15);
    });
    lines.push(values.join(' | '));
  }
  lines.push('</pre>');

  if (data.length > 20) {
    lines.push(`\n<i>... and ${data.length - 20} more rows</i>`);
  }

  // Truncate if too long
  let result = lines.join('\n');
  if (result.length > MAX_MESSAGE_LENGTH) {
    result = result.substring(0, MAX_MESSAGE_LENGTH - 50) + '\n\n<i>... (truncated)</i>';
  }

  return result;
}

function truncate(str: string, maxLen: number): string {
  const s = String(str);
  return s.length > maxLen ? s.substring(0, maxLen - 2) + '..' : s.padEnd(maxLen);
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
