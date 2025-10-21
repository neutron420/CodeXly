import Hero from '@/components/neural-network-hero'; // Import the Hero component
import { Header1 } from "@/components/ui/header"; // Import the Header1 component
import { Pricing } from '@/components/pricing'; // Import the Pricing component

// Define your pricing plans data
const pricingPlans = [
  {
    name: "Starter",
    price: "19",
    yearlyPrice: "180", // Approx 20% saving from 19*12 = 228
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
    yearlyPrice: "470", // Approx 20% saving from 49*12 = 588
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
    isPopular: true, // Highlight this plan
  },
  {
    name: "Enterprise",
    price: "99", // Or "Contact Us"
    yearlyPrice: "950", // Approx 20% saving from 99*12 = 1188
    period: "month", // Or custom
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
      <Header1 /> {/* Render the Header1 component */}
      {/* Render the Hero component */}
      <Hero
        title="CodeXly"
        description="Leveraging AI to generate, explain, and optimize code across languages and frameworks."
      />
      {/* Render the Pricing component below the Hero section */}
      <Pricing plans={pricingPlans} />
    </>
  );
}