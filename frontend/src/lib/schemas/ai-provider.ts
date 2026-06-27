import { z } from "zod/v3";

export const aiProviderSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  api_format: z.enum(["openai", "anthropic"], {
    required_error: "Pilih format API",
  }),
  base_url: z
    .string()
    .min(1, "Base URL wajib diisi")
    .url("Base URL tidak valid"),
  api_key: z.string(),
  model: z.string().min(1, "Model wajib diisi"),
  is_default: z.boolean(),
});

export type AiProviderFormValues = z.infer<typeof aiProviderSchema>;

export const aiProviderDefaultValues: AiProviderFormValues = {
  name: "",
  api_format: "openai",
  base_url: "https://api.openai.com",
  api_key: "",
  model: "gpt-4o",
  is_default: false,
};
