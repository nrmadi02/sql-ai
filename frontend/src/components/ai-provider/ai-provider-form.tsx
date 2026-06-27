"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConnectIcon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateAiProvider,
  useTestAiProviderConnection,
  useUpdateAiProvider,
} from "@/hooks/use-ai-provider";
import { buttons, formLabels, formPlaceholders } from "@/lib/microcopy";
import {
  type AiProviderFormValues,
  aiProviderDefaultValues,
  aiProviderSchema,
} from "@/lib/schemas/ai-provider";
import type { AiProvider } from "@/lib/types";
import { cn } from "@/lib/utils";

type AiProviderFormProps = {
  provider?: AiProvider | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
};

function AiProviderForm({
  provider,
  onSuccess,
  onCancel,
  className,
}: AiProviderFormProps) {
  const isEditing = Boolean(provider?.id);
  const createMutation = useCreateAiProvider();
  const updateMutation = useUpdateAiProvider(provider?.id ?? "");
  const testMutation = useTestAiProviderConnection();

  const form = useForm<AiProviderFormValues>({
    resolver: zodResolver(aiProviderSchema),
    defaultValues: provider
      ? {
          name: provider.name,
          api_format: provider.api_format,
          base_url: provider.base_url,
          api_key: "",
          model: provider.model,
          is_default: provider.is_default,
        }
      : aiProviderDefaultValues,
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const isBusy =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    testMutation.isPending;

  async function onSubmit(values: AiProviderFormValues) {
    if (!values.api_key.trim()) {
      form.setError("api_key", {
        message: "API key wajib diisi untuk menyimpan",
      });
      return;
    }

    if (isEditing && provider) {
      await updateMutation.mutateAsync({
        ...values,
        api_key: values.api_key,
        is_default: values.is_default,
      });
    } else {
      await createMutation.mutateAsync({
        ...values,
        api_key: values.api_key,
        is_default: values.is_default,
      });
      form.reset(aiProviderDefaultValues);
    }
    onSuccess?.();
  }

  async function handleTestConnection() {
    const values = form.getValues();
    const useSavedCredentials =
      isEditing && provider?.id && !values.api_key.trim();

    if (!useSavedCredentials) {
      const valid = await form.trigger();
      if (!valid) return;
      if (!values.api_key.trim()) {
        form.setError("api_key", {
          message: "API key wajib diisi untuk tes koneksi",
        });
        return;
      }
    }

    await testMutation.mutateAsync({
      values,
      providerId: useSavedCredentials ? provider?.id : undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">
          {isEditing ? "Ubah provider" : "Provider baru"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isEditing
            ? "Perbarui detail provider. API key kosong berarti tidak diubah saat tes koneksi."
            : "Daftarkan provider OpenAI-compatible atau Anthropic-compatible."}
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="provider-name">
            {formLabels.providerName}
          </FieldLabel>
          <Input
            id="provider-name"
            placeholder={formPlaceholders.providerName}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.api_format}>
          <FieldLabel>{formLabels.apiFormat}</FieldLabel>
          <Controller
            control={control}
            name="api_format"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI-compatible</SelectItem>
                  <SelectItem value="anthropic">
                    Anthropic-compatible
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldDescription>
            Groq, Ollama, dan OpenRouter biasanya memakai format OpenAI.
          </FieldDescription>
          <FieldError errors={[errors.api_format]} />
        </Field>

        <Field data-invalid={!!errors.base_url}>
          <FieldLabel htmlFor="base-url">{formLabels.baseUrl}</FieldLabel>
          <Input
            id="base-url"
            placeholder={formPlaceholders.baseUrl}
            aria-invalid={!!errors.base_url}
            {...register("base_url")}
          />
          <FieldError errors={[errors.base_url]} />
        </Field>

        <Field data-invalid={!!errors.model}>
          <FieldLabel htmlFor="model">{formLabels.model}</FieldLabel>
          <Input
            id="model"
            placeholder={formPlaceholders.model}
            aria-invalid={!!errors.model}
            {...register("model")}
          />
          <FieldError errors={[errors.model]} />
        </Field>

        <Field data-invalid={!!errors.api_key}>
          <FieldLabel htmlFor="api-key">{formLabels.apiKey}</FieldLabel>
          <Input
            id="api-key"
            type="password"
            autoComplete="new-password"
            placeholder={formPlaceholders.apiKey}
            aria-invalid={!!errors.api_key}
            {...register("api_key")}
          />
          {isEditing ? (
            <FieldDescription>
              Wajib diisi saat menyimpan. Kosongkan hanya untuk tes koneksi
              dengan kredensial tersimpan.
            </FieldDescription>
          ) : null}
          <FieldError errors={[errors.api_key]} />
        </Field>

        <Field>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="is_default"
              render={({ field }) => (
                <Checkbox
                  id="is-default"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              )}
            />
            <FieldLabel htmlFor="is-default" className="font-normal">
              Jadikan provider default
            </FieldLabel>
          </div>
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isBusy}>
          {isBusy && !testMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
          )}
          {isEditing ? buttons.saveChanges : buttons.registerProvider}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={handleTestConnection}
        >
          {testMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={ConnectIcon} strokeWidth={2} />
          )}
          {buttons.testConnection}
        </Button>

        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={onCancel}
          >
            {buttons.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { AiProviderForm };
