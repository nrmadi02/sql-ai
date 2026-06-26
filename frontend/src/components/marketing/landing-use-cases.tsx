"use client";

import { LandingReveal } from "@/components/marketing/landing-reveal";

const personas = [
  {
    role: "Manajer operasional",
    name: "Budi Santoso",
    quote:
      "Saya cek angka penjualan harian sendiri. Tidak perlu antre ke engineering untuk query sederhana.",
  },
  {
    role: "Analis bisnis",
    name: "Dewi Kartika",
    quote:
      "Eksplorasi data mandiri jadi lebih cepat. Pertanyaan follow-up tinggal diketik ulang di chat.",
  },
  {
    role: "Tim finance",
    name: "Rina Wijaya",
    quote:
      "Laporan periodik yang biasanya nunggu SQL dari tim teknis, sekarang bisa disiapkan lebih awal.",
  },
] as const;

function LandingUseCases() {
  return (
    <section id="untuk-siapa" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <LandingReveal>
            <h2 className="max-w-[20ch] font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Untuk tim yang butuh data, bukan kode
            </h2>
            <p className="mt-4 max-w-[40ch] text-muted-foreground text-base leading-relaxed">
              SQL AI ditujukan untuk manajer, analis, dan tim operasional yang
              sering menunggu query dari engineering.
            </p>
          </LandingReveal>

          <div className="flex flex-col gap-4">
            {personas.map((persona, index) => (
              <LandingReveal key={persona.name} delay={index * 0.08}>
                <article className="rounded-lg border border-border bg-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="font-medium text-sm tracking-tight">
                      {persona.role}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {persona.name}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">
                    {persona.quote}
                  </p>
                </article>
              </LandingReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { LandingUseCases };
