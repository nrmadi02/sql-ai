import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingUseCases } from "@/components/marketing/landing-use-cases";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingUseCases />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
