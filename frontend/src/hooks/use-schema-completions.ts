"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListTablesResult, TableDetail } from "@/lib/types";
import { schemaKeys } from "@/hooks/use-schema";

export type SchemaCompletions = Record<string, string[]>;

export function useSchemaCompletions(datasourceId: string | null) {
  return useQuery({
    queryKey: schemaKeys.completions(datasourceId ?? ""),
    queryFn: async (): Promise<SchemaCompletions> => {
      const list = await api.get<ListTablesResult>(
        `/api/v1/datasources/${datasourceId}/tables`,
      );

      const schema: SchemaCompletions = {};

      await Promise.all(
        list.tables.map(async (table) => {
          const detail = await api.get<TableDetail>(
            `/api/v1/datasources/${datasourceId}/tables/${encodeURIComponent(table.name)}`,
          );
          schema[detail.name] = detail.columns.map((column) => column.name);
        }),
      );

      return schema;
    },
    enabled: Boolean(datasourceId),
    staleTime: 5 * 60 * 1000,
  });
}
