// app/signup/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react"; // Import signIn to log user in after signup
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SignUpPage() {
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // If already authenticated, redirect away from sign-up page
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        // Optionally sign in the user immediately after successful registration
        const signInResult = await signIn('credentials', {
            redirect: false, // Handle redirect manually
            email,
            password,
        });

        if (signInResult?.ok) {
            router.push("/"); // Redirect to home page after sign up and sign in
            router.refresh();
        } else {
             // Handle sign-in error after sign-up (e.g., show message, redirect to sign-in)
             setError("Account created, but auto sign-in failed. Please sign in manually.");
             // Optionally redirect to sign-in page after a delay
             setTimeout(() => router.push('/signin'), 3000);
        }

      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed. Please try again.');
        console.error("Sign-up error:", data);
      }
    } catch (err) {
      console.error("Sign-up exception:", err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-8 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="px-4 sm:px-6 pt-6 sm:pt-6 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Sign Up</CardTitle>
          <CardDescription className="text-sm">Create your CodeXly account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
             <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6} // Example minimum length
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-xs sm:text-sm text-red-500 break-words">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-6">
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
             <p className="text-xs sm:text-sm text-center text-muted-foreground">
               Already have an account?{" "}
               <Link href="/signin" className="underline hover:text-primary">
                 Sign In
               </Link>
             </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}