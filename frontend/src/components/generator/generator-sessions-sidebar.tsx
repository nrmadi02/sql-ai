"use client";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
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

function GeneratorSessionsSidebar() {
  const pathname = usePathname();
  const { activeDatasourceId } = useActiveDatasource();
  const { data: providers } = useAiProviders();
  const sessionsQuery = useGeneratorSessions();
  const createSession = useCreateGeneratorSession();
  const deleteSession = useDeleteGeneratorSession();

  const defaultProvider = providers?.find((item) => item.is_default);

  const handleCreateSession = () => {
    createSession.mutate({
      datasource_id: activeDatasourceId ?? undefined,
      ai_provider_id: defaultProvider?.id,
    });
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex items-center justify-between pr-1">
        <span>Percakapan</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 shrink-0"
          disabled={createSession.isPending}
          onClick={handleCreateSession}
          aria-label={buttons.newSession}
        >
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </Button>
      </SidebarGroupLabel>
      <SidebarGroupContent className="min-w-0">
        {sessionsQuery.isLoading ? (
          <div className="flex flex-col gap-1.5 px-1">
            {(["a", "b", "c"] as const).map((id) => (
              <Skeleton key={id} className="h-9 w-full" />
            ))}
          </div>
        ) : sessionsQuery.data?.length ? (
          <ScrollArea className="max-h-[min(40vh,240px)]">
            <SidebarMenu>
              {sessionsQuery.data.map((session) => {
                const href = `/generator/${session.id}`;
                const isActive = pathname === href;
                const title = sessionTitle(session.title);
                return (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={title}
                      className="h-auto min-w-0 py-2"
                    >
                      <Link href={href} className="min-w-0">
                        <HugeiconsIcon
                          icon={BubbleChatSpark01Icon}
                          strokeWidth={2}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                          <span className="w-full truncate text-xs" title={title}>
                            {title}
                          </span>
                          <span className="w-full truncate text-muted-foreground text-[0.65rem]">
                            {formatDistanceToNow(new Date(session.updated_at), {
                              addSuffix: true,
                              locale: localeId,
                            })}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          className={cn(
                            "text-muted-foreground hover:text-destructive",
                          )}
                          aria-label={`Hapus ${title}`}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        </SidebarMenuAction>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus percakapan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Semua pesan di sesi ini akan hilang. Tindakan ini
                            tidak bisa dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {buttons.cancel}
                          </AlertDialogCancel>
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
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {generator.noSessions}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              disabled={createSession.isPending}
              onClick={handleCreateSession}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              {buttons.newSession}
            </Button>
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export { GeneratorSessionsSidebar };
