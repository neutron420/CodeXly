// app/signin/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Icons } from "@/components/ui/icons"; // Assuming you have icons component

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        console.error("Credentials Sign-in error:", result.error);
      } else if (result?.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Credentials Sign-in exception:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      setError(null); // Clear previous errors
      try {
          // Redirects the user to Google, then back to callbackUrl on success
          await signIn("google", { callbackUrl: "/" });
          // Note: Code execution stops here on successful redirect
      } catch (err) {
          console.error("Google Sign-in error:", err);
          setError("Failed to sign in with Google. Please try again.");
          setIsGoogleLoading(false); // Only needed if signIn throws an error before redirect
      }
      // setIsLoading(false); // No need for this if redirect happens
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your credentials or use a provider.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
            {/* --- GOOGLE BUTTON --- */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Icons.google className="mr-2 h-4 w-4" /> // Ensure Icons.google exists
              )}{" "}
              Continue with Google
            </Button>

            {/* --- SEPARATOR --- */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" /> {/* Use theme border */}
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground"> {/* Use theme colors */}
                  Or continue with
                </span>
              </div>
            </div>

          {/* --- CREDENTIALS FORM --- */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
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
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500 pt-2">{error}</p>} {/* Added padding */}

            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? "Signing In..." : "Sign In with Email"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}