import Hero from '@/components/neural-network-hero'; // Import the Hero component

export default function Home() {
  return (
    // Render the Hero component and pass the required props
    <Hero
      title="CodeXly" // Add your desired title
      description="Leveraging AI to generate, explain, and optimize code across languages and frameworks." // Add your desired description
      // You can customize other props like badgeText, ctaButtons, etc., if needed
    />
  );
}