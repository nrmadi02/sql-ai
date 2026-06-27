import { sqlEditor } from "@/lib/microcopy";

export function resolveSqlEditorSessionName(name?: string) {
  const trimmed = name?.trim();
  return trimmed || sqlEditor.untitledSession;
}