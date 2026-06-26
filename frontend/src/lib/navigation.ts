import {
  Bookmark01Icon,
  BubbleChatSpark01Icon,
  Clock01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

// Primary navigation. Identifiers in English; visible labels in Indonesian
// (copy only). Labels double as nav anchors for muscle memory/SEO, so do not
// rename the user-facing strings without intent (skill 11.F).
export type NavItem = {
  label: string;
  href: string;
  icon: typeof BubbleChatSpark01Icon;
  description: string;
};

export const primaryNav: NavItem[] = [
  {
    label: "Generator",
    href: "/generator",
    icon: BubbleChatSpark01Icon,
    description: "Tanya database pakai bahasa biasa",
  },
  {
    label: "Riwayat",
    href: "/history",
    icon: Clock01Icon,
    description: "Query yang pernah dijalankan",
  },
  {
    label: "Tersimpan",
    href: "/saved",
    icon: Bookmark01Icon,
    description: "Query yang disimpan untuk dipakai lagi",
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings02Icon,
    description: "Datasource dan AI provider",
  },
];
