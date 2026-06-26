import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/empty-state";

// Saved queries page. No data yet -> empty state.
export default function SavedPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={Bookmark01Icon}
        title="Belum ada query tersimpan"
        description="Simpan query yang sering dipakai agar bisa dijalankan ulang tanpa menulis ulang dari nol."
      />
    </div>
  );
}
