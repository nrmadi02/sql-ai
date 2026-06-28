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

function normalizeAssistantJSONCandidate(raw: string): string {
  let candidate = raw.trim();
  const lower = candidate.toLowerCase();
  if (lower.startsWith("chart ") || lower.startsWith("json ")) {
    candidate = candidate.slice(candidate.indexOf(" ") + 1).trim();
  }
  return candidate;
}

export function sanitizeAssistantDisplayContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const firstLine =
    trimmed
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? trimmed;

  const candidates = [
    normalizeAssistantJSONCandidate(trimmed),
    normalizeAssistantJSONCandidate(firstLine),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { content?: unknown };
      if (typeof parsed.content === "string" && parsed.content.trim()) {
        return parsed.content.trim();
      }
    } catch {
      // ignore invalid JSON candidates
    }
  }

  return trimmed
    .replace(/```chart[\s\S]*?```/gi, "")
    .replace(/^\s*\{[^{}]*"chart_type"[\s\S]*?\}\s*$/gim, "")
    .replace(/^\s*chart\s+\{/gim, "{")
    .trim();
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
