import { Clock01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/empty-state";

// Query history page. No data yet -> empty state.
export default function HistoryPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={Clock01Icon}
        title="Belum ada riwayat"
        description="Setiap query yang kamu jalankan akan tercatat di sini, lengkap dengan status dan waktu eksekusi."
      />
    </div>
  );
}
