"use client";

import type * as React from "react";
import {
  Add01Icon,
  BubbleChatSpark01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAiProviders } from "@/hooks/use-ai-provider";
import {
  useCreateGeneratorSession,
  useDeleteGeneratorSession,
  useGeneratorSessions,
} from "@/hooks/use-generator";
import { buttons, generator } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

function sessionTitle(title?: string) {
  const trimmed = title?.trim();
  return trimmed || generator.untitledSession;
}

type GeneratorSessionsSheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

function GeneratorSessionsList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { activeDatasourceId } = useActiveDatasource();
  const { data: providers } = useAiProviders();
  const sessionsQuery = useGeneratorSessions();
  const createSession = useCreateGeneratorSession();
  const deleteSession = useDeleteGeneratorSession();
  const defaultProvider = providers?.find((item) => item.is_default);

  const handleCreateSession = () => {
    createSession.mutate(
      {
        datasource_id: activeDatasourceId ?? undefined,
        ai_provider_id: defaultProvider?.id,
      },
      { onSuccess: () => onNavigate?.() },
    );
  };

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1">
        {(["a", "b", "c"] as const).map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!sessionsQuery.data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-4">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {generator.noSessions}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={createSession.isPending}
          onClick={handleCreateSession}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          {buttons.newSession}
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {sessionsQuery.data.map((session) => {
        const href = `/generator/${session.id}`;
        const isActive = pathname === href;
        const title = sessionTitle(session.title);
        return (
          <li key={session.id} className="group">
            <div
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2 py-2 transition-colors",
                isActive
                  ? "border-border bg-card shadow-xs"
                  : "border-transparent hover:border-border/60 hover:bg-muted/30",
              )}
            >
              <Link
                href={href}
                onClick={() => onNavigate?.()}
                className="flex min-w-0 flex-1 items-start gap-2.5"
              >
                <HugeiconsIcon
                  icon={BubbleChatSpark01Icon}
                  strokeWidth={2}
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm" title={title}>
                    {title}
                  </p>
                  <p className="truncate text-[0.65rem] text-muted-foreground">
                    {formatDistanceToNow(new Date(session.updated_at), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                </div>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Hapus ${title}`}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus percakapan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua pesan di sesi ini akan hilang. Tindakan ini tidak
                      bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{buttons.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={deleteSession.isPending}
                      onClick={() => deleteSession.mutate(session.id)}
                    >
                      {buttons.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function GeneratorSessionsSheet({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: GeneratorSessionsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle>Percakapan</SheetTitle>
          <SheetDescription>
            Lanjutkan percakapan lama atau mulai yang baru.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <GeneratorSessionsList onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GeneratorSessionsSheetTrigger() {
  return (
    <GeneratorSessionsSheet
      trigger={
        <Button type="button" variant="outline" size="sm">
          <HugeiconsIcon icon={BubbleChatSpark01Icon} strokeWidth={2} />
          {generator.openSessions}
        </Button>
      }
    />
  );
}

export {
  GeneratorSessionsSheet,
  GeneratorSessionsList,
  GeneratorSessionsSheetTrigger,
};
