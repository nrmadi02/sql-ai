import type { Completion, CompletionContext } from "@codemirror/autocomplete";

/** Multi-line SQL templates — ranked below keywords, tables, and columns. */
export const SQL_SNIPPETS: Completion[] = [
  {
    label: "tpl-select",
    displayLabel: "SELECT * FROM …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "SELECT *\nFROM \nWHERE ",
    info: "Template SELECT dasar",
  },
  {
    label: "tpl-count",
    displayLabel: "SELECT COUNT(*) …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "SELECT COUNT(*)\nFROM \nWHERE ",
  },
  {
    label: "tpl-distinct",
    displayLabel: "SELECT DISTINCT …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "SELECT DISTINCT \nFROM \nWHERE ",
  },
  {
    label: "tpl-insert",
    displayLabel: "INSERT INTO …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "INSERT INTO  ()\nVALUES ()",
  },
  {
    label: "tpl-update",
    displayLabel: "UPDATE … SET …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "UPDATE \nSET  = \nWHERE ",
  },
  {
    label: "tpl-delete",
    displayLabel: "DELETE FROM …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "DELETE FROM \nWHERE ",
  },
  {
    label: "tpl-join",
    displayLabel: "INNER JOIN … ON …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "INNER JOIN  ON . = ",
  },
  {
    label: "tpl-ljoin",
    displayLabel: "LEFT JOIN … ON …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "LEFT JOIN  ON . = ",
  },
  {
    label: "tpl-group",
    displayLabel: "GROUP BY … HAVING …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "GROUP BY \nHAVING ",
  },
  {
    label: "tpl-order",
    displayLabel: "ORDER BY …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply: "ORDER BY  ASC",
  },
  {
    label: "tpl-cte",
    displayLabel: "WITH … AS (…) SELECT …",
    type: "text",
    detail: "Template",
    boost: -10,
    apply:
      "WITH  AS (\n  SELECT \n  FROM \n  WHERE \n)\nSELECT *\nFROM ",
  },
];

export function snippetCompletions(
  context: CompletionContext,
): { from: number; options: Completion[] } | null {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const query = word.text.toLowerCase();
  const options = SQL_SNIPPETS.filter((snippet) =>
    snippet.label.toLowerCase().includes(query),
  );

  if (!options.length) return null;

  return { from: word.from, options };
}