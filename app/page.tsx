import Hero from '@/components/neural-network-hero'; // Import the Hero component
import { Header1 } from "@/components/ui/header"; // Import the Header1 component

export default function Home() {
  return (
    <>
      <Header1 /> {/* Render the Header1 component */}
      {/* Render the Hero component and pass the required props */}
      <Hero
        title="CodeXly" // Add your desired title
        description="Leveraging AI to generate, explain, and optimize code across languages and frameworks." // Add your desired description
        // You can customize other props like badgeText, ctaButtons, etc., if needed
      />
    </>
  );
}