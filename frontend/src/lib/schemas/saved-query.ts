import { z } from "zod/v3";

export const savedQuerySchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(255, "Nama maksimal 255 karakter"),
  description: z.string().max(2000, "Deskripsi terlalu panjang").optional(),
  tags: z.string().optional(),
});

export type SavedQueryFormValues = z.infer<typeof savedQuerySchema>;

export const savedQueryDefaultValues: SavedQueryFormValues = {
  name: "",
  description: "",
  tags: "",
};

export function parseTagsInput(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
