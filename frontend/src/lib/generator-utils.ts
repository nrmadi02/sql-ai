// Table mention parsing mirrors backend usecase/table_mention.go.

const TABLE_MENTION_PATTERN =
  /(?:^|[\s(,])\/([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;

function normalizeTableName(name: string): string {
  return name
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[.,;:!?]+$/, "");
}

export function parseReferencedTables(
  content: string,
  explicit: string[] = [],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const add = (name: string) => {
    const normalized = normalizeTableName(name);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  };

  for (const table of explicit) {
    add(table);
  }

  for (const match of content.matchAll(TABLE_MENTION_PATTERN)) {
    if (match[1]) {
      add(match[1]);
    }
  }

  return result;
}

export function detectTableMentionQuery(
  value: string,
  cursorPosition: number,
): { query: string; start: number } | null {
  const beforeCursor = value.slice(0, cursorPosition);
  const match = /(?:^|[\s(,])\/([a-zA-Z0-9_.]*)$/.exec(beforeCursor);
  if (!match) return null;

  return {
    query: match[1] ?? "",
    start: beforeCursor.lastIndexOf("/"),
  };
}

export function insertTableMention(
  value: string,
  start: number,
  cursorPosition: number,
  tableName: string,
): { nextValue: string; nextCursor: number } {
  const before = value.slice(0, start);
  const after = value.slice(cursorPosition);
  const nextValue = `${before}/${tableName} ${after}`;
  const nextCursor = before.length + tableName.length + 2;
  return { nextValue, nextCursor };
}
