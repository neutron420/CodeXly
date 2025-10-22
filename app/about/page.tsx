
"use client"; 

import React from "react";
import Link from "next/link";
import { Header1 } from "@/components/ui/header"; // Use your existing Header1 component
import { BrainCircuit, Zap, Layers } from "lucide-react"; // Example icons

export default function AboutPage() {
  return (
    // Use theme variables for background and text colors
    <div className="min-h-screen bg-background text-foreground">
      <Header1 />
      {/* Adjusted padding for more space below the fixed header */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <header className="mb-16">
          <div className="text-center">
            {/* Updated title */}
            <h1 className="text-5xl font-bold text-foreground mb-4">About CodeXly</h1>
            {/* Updated subtitle */}
            <p className="text-xl text-muted-foreground">
              Leveraging AI for smarter code generation, explanation, and optimization
            </p>
            {/* Use primary color for accent */}
            <div className="w-24 h-1 bg-primary mx-auto mt-6"></div>
          </div>
        </header>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <div className="w-16 h-0.5 bg-primary mx-auto"></div>
          </div>
          {/* Use card styling for better theme consistency */}
          <div className="bg-card border border-border rounded-lg p-8">
            <p className="text-lg text-card-foreground leading-relaxed text-center max-w-3xl mx-auto">
              CodeXly aims to empower developers by integrating cutting-edge AI into the coding workflow.
              We provide tools to effortlessly generate, deeply understand, and significantly optimize code
              across various languages and frameworks, fostering innovation and enhancing productivity for developers everywhere.
            </p>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Powered by Modern Technology</h2>
            <div className="w-16 h-0.5 bg-primary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Use card styling */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Core & AI</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span className="text-muted-foreground">Next.js for a seamless full-stack experience</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span className="text-muted-foreground">Advanced AI Models for code tasks</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span className="text-muted-foreground">TypeScript for robust, type-safe code</span>
                </li>
                 <li className="flex items-center">
                   <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                   <span className="text-muted-foreground">Three.js & React Three Fiber for interactive visuals</span>
                 </li>
              </ul>
            </div>

            {/* Use card styling */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Styling & UI</h3>
              <ul className="space-y-3">
                 <li className="flex items-center">
                   <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                   <span className="text-muted-foreground">Tailwind CSS for utility-first styling</span>
                 </li>
                 <li className="flex items-center">
                   <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                   <span className="text-muted-foreground">Shadcn/UI for accessible components</span>
                 </li>
                 <li className="flex items-center">
                   <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                   <span className="text-muted-foreground">Framer Motion for smooth animations</span>
                 </li>
                 <li className="flex items-center">
                   <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                   <span className="text-muted-foreground">GSAP for complex animations</span>
                 </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why CodeXly Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why CodeXly</h2>
            <div className="w-16 h-0.5 bg-primary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-card border border-border rounded-lg">
              <BrainCircuit className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground mb-3">AI-Powered Insights</h3>
              <p className="text-muted-foreground">Generate, explain, and optimize code with intelligent assistance.</p>
            </div>
            <div className="text-center p-6 bg-card border border-border rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground mb-3">Accelerated Workflow</h3>
              <p className="text-muted-foreground">Spend less time on boilerplate and debugging, more time creating.</p>
            </div>
            <div className="text-center p-6 bg-card border border-border rounded-lg">
              <Layers className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold text-foreground mb-3">Cross-Framework</h3>
              <p className="text-muted-foreground">Apply AI capabilities across a wide range of languages and tools.</p>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="mb-16">
          {/* Use card styling with inverted colors */}
          <div className="bg-foreground text-background rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Enhancing Developer Potential</h2>
              <p className="text-lg text-muted leading-relaxed max-w-3xl mx-auto">
                We envision a future where AI acts as a collaborative partner for developers.
                CodeXly strives to make sophisticated AI tools accessible, helping developers learn faster,
                build more efficiently, and push the boundaries of software innovation, regardless of team size or budget.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-foreground mb-2">2025</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Project Inception</div>
            </div>
            <div className="p-6">
               <div className="text-3xl font-bold text-foreground mb-2">AI Core</div>
               <div className="text-sm text-muted-foreground uppercase tracking-wide">Technology Focus</div>
             </div>
            <div className="p-6">
               <div className="text-3xl font-bold text-foreground mb-2">Global</div>
               <div className="text-sm text-muted-foreground uppercase tracking-wide">Developer Reach</div>
             </div>
          </div>
        </section>

        {/* Developer Section */}
        <section className="mb-16">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-foreground mb-4">Behind CodeXly</h2>
             <div className="w-16 h-0.5 bg-primary mx-auto"></div>
           </div>
           
           <div className="max-w-2xl mx-auto">
             <div className="bg-card border border-border rounded-lg p-8 text-center">
               <div className="mb-6">
                 <h3 className="text-xl font-semibold text-foreground mb-2">Driven by Innovation</h3>
                 <p className="text-muted-foreground">
                   CodeXly is born from a passion for exploring the intersection of AI and software development.
                   It represents dedicated effort in research, engineering, and user experience design, aiming
                   to deliver a truly valuable tool for the modern developer.
                 </p>
               </div>
               
               <div className="space-y-2 text-sm">
                 <p className="text-muted-foreground">
                   <span className="font-medium text-foreground">Focus:</span> AI Integration, Developer Tools, Performance Optimization
                 </p>
                 <p className="text-muted-foreground">
                   <span className="font-medium text-foreground">Mission:</span> To make AI an indispensable coding assistant
                 </p>
                 <p className="text-muted-foreground">
                   <span className="font-medium text-foreground">Vision:</span> Seamless human-AI collaboration in software creation
                 </p>
               </div>
             </div>
           </div>
         </section>

        {/* Call to Action */}
        <footer className="text-center pt-8 border-t border-border">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Ready to enhance your code?</h3>
            <div className="flex justify-center gap-4">
              {/* Use primary button style */}
              <Link
                href="/" // Link to your compiler/tool page if you have one, else home
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Explore Features
              </Link>
              {/* Use outline button style */}
              <Link
                href="/"
                className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}