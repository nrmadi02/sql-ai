import { z } from "zod/v3";

export const datasourceSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  db_type: z.enum(["postgresql", "mysql"], {
    required_error: "Pilih tipe database",
  }),
  host: z.string().min(1, "Host wajib diisi"),
  port: z
    .number({
      required_error: "Port wajib diisi",
      invalid_type_error: "Port tidak valid",
    })
    .int()
    .min(1, "Port tidak valid")
    .max(65535),
  database_name: z.string().min(1, "Nama database wajib diisi"),
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string(),
  ssl_mode: z.enum(["disable", "require", "verify-full"]),
});

export type DatasourceFormValues = z.infer<typeof datasourceSchema>;

export const datasourceDefaultValues: DatasourceFormValues = {
  name: "",
  db_type: "postgresql",
  host: "localhost",
  port: 5432,
  database_name: "",
  username: "",
  password: "",
  ssl_mode: "disable",
};

export const dbTypePortDefaults: Record<
  DatasourceFormValues["db_type"],
  number
> = {
  postgresql: 5432,
  mysql: 3306,
};
