"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSavedQuery } from "@/hooks/use-saved-query";
import { buttons, saved } from "@/lib/microcopy";
import {
  parseTagsInput,
  type SavedQueryFormValues,
  savedQueryDefaultValues,
  savedQuerySchema,
} from "@/lib/schemas/saved-query";

type SaveQueryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sql: string;
  datasourceId?: string;
  generatorMessageId?: string;
  defaultName?: string;
};

function SaveQueryDialog({
  open,
  onOpenChange,
  sql,
  datasourceId,
  generatorMessageId,
  defaultName,
}: SaveQueryDialogProps) {
  const createMutation = useCreateSavedQuery();

  const form = useForm<SavedQueryFormValues>({
    resolver: zodResolver(savedQuerySchema),
    defaultValues: savedQueryDefaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        ...savedQueryDefaultValues,
        name: defaultName ?? "",
      });
    }
  }, [open, defaultName, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      name: values.name,
      description: values.description,
      sql_content: sql,
      datasource_id: datasourceId,
      tags: parseTagsInput(values.tags),
      generator_message_id: generatorMessageId,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{saved.saveDialogTitle}</DialogTitle>
          <DialogDescription>{saved.saveDialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="saved-query-name">
                {saved.nameLabel}
              </FieldLabel>
              <Input
                id="saved-query-name"
                placeholder={saved.namePlaceholder}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="saved-query-description">
                {saved.descriptionLabel}
              </FieldLabel>
              <Textarea
                id="saved-query-description"
                rows={2}
                placeholder={saved.descriptionPlaceholder}
                {...form.register("description")}
              />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="saved-query-tags">
                {saved.tagsLabel}
              </FieldLabel>
              <Input
                id="saved-query-tags"
                placeholder={saved.tagsPlaceholder}
                {...form.register("tags")}
              />
              <FieldDescription>{saved.tagsHint}</FieldDescription>
              <FieldError errors={[form.formState.errors.tags]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {buttons.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {buttons.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SaveQueryDialog };
