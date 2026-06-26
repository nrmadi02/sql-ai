import Link from "next/link";

const footerLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "App", href: "/generator" },
] as const;

function LandingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight">
            SQL AI
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            Tanya databasenya pakai bahasa biasa
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-6xl px-4 text-muted-foreground text-xs sm:px-6">
        © 2026 SQL AI
      </p>
    </footer>
  );
}

export { LandingFooter };
