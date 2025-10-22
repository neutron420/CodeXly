// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/session-provider"; // Import the provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeXly", // Changed title
  description: "Leveraging AI for smarter code", // Changed description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add the 'dark' class to the <html> tag here
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap children with the Session Provider */}
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}