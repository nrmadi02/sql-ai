const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "ON",
  "GROUP",
  "BY",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "AS",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "DISTINCT",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "WITH",
]);

const BREAK_BEFORE = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL OUTER JOIN",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "UNION",
  "UNION ALL",
]);

function normalizeWhitespace(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function uppercaseKeywords(sql: string): string {
  return sql.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (word) =>
    SQL_KEYWORDS.has(word.toUpperCase()) ? word.toUpperCase() : word,
  );
}

function insertLineBreaks(sql: string): string {
  let result = sql;

  for (const keyword of BREAK_BEFORE) {
    const pattern = new RegExp(
      `\\s+(${keyword.replace(/\s+/g, "\\s+")})\\b`,
      "gi",
    );
    result = result.replace(pattern, `\n$1`);
  }

  return result
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function indentClauses(sql: string): string {
  const lines = sql.split("\n");
  const indented: string[] = [];

  for (const line of lines) {
    const upper = line.toUpperCase();
    const isMajor =
      upper.startsWith("FROM") ||
      upper.startsWith("WHERE") ||
      upper.startsWith("JOIN") ||
      upper.startsWith("INNER") ||
      upper.startsWith("LEFT") ||
      upper.startsWith("RIGHT") ||
      upper.startsWith("FULL") ||
      upper.startsWith("GROUP") ||
      upper.startsWith("ORDER") ||
      upper.startsWith("HAVING") ||
      upper.startsWith("LIMIT") ||
      upper.startsWith("UNION");

    indented.push(isMajor && !upper.startsWith("SELECT") ? `  ${line}` : line);
  }

  return indented.join("\n");
}

export function formatSql(sql: string): string {
  if (!sql.trim()) return sql;

  const normalized = normalizeWhitespace(sql);
  const uppercased = uppercaseKeywords(normalized);
  const broken = insertLineBreaks(uppercased);
  return indentClauses(broken);
}

export function parseSqlErrorLine(message: string): number | null {
  const patterns = [
    /line\s+(\d+)/i,
    /baris\s+(\d+)/i,
    /at\s+line\s+(\d+)/i,
    /LINE\s+(\d+)/,
    /position\s+\d+\s+.*line\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const line = Number.parseInt(match[1], 10);
      if (line > 0) return line;
    }
  }

  return null;
}
