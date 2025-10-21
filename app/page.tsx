import Hero from '@/components/neural-network-hero';
import { Header1 } from "@/components/ui/header";
import { Pricing } from '@/components/pricing';
import { Features } from '@/components/features-5';
import { LiveStats } from '@/components/live-stats'; 

// Define your pricing plans data
const pricingPlans = [
  {
    name: "Starter",
    price: "19",
    yearlyPrice: "180",
    period: "month",
    features: [
      "Access to core features",
      "Basic AI code generation",
      "Limited code explanations",
      "Email support",
    ],
    description: "Ideal for individuals starting out.",
    buttonText: "Get Started",
    href: "/signup/starter",
    isPopular: false,
  },
  {
    name: "Pro",
    price: "49",
    yearlyPrice: "470",
    period: "month",
    features: [
      "All Starter features",
      "Advanced AI code generation",
      "Unlimited code explanations",
      "Code optimization suggestions",
      "Priority email support",
    ],
    description: "Perfect for professionals and small teams.",
    buttonText: "Choose Pro",
    href: "/signup/pro",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "99",
    yearlyPrice: "950",
    period: "month",
    features: [
      "All Pro features",
      "Team collaboration tools",
      "Custom model training",
      "Dedicated account manager",
      "24/7 premium support",
    ],
    description: "Tailored for large organizations.",
    buttonText: "Contact Sales",
    href: "/contact-sales",
    isPopular: false,
  },
];

export default function Home() {
  return (
    <>
      <Header1 />
      <Hero
        title="CodeXly"
        description="Leveraging AI to generate, explain, and optimize code across languages and frameworks."
      />
      <Pricing plans={pricingPlans} />
      <Features />
      <LiveStats />
    </>
  );
}