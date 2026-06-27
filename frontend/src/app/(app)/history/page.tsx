import { Suspense } from "react";
import { QueryHistorySettings } from "@/components/history/query-history-settings";
import { Spinner } from "@/components/ui/spinner";

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <Spinner className="size-6" />
        </div>
      }
    >
      <QueryHistorySettings />
    </Suspense>
  );
}
