// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons"; // Assuming you have a spinner icon

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null); // For success feedback before redirect
  const [error, setError] = useState<string | null>(null); // For error feedback
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/password/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (response.ok) { // Status 200-299: User exists, OTP sent
        setMessage('Redirecting to verify code...'); // Show temporary message
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`); // Redirect
        return; // Stop further execution in this function
      } else {
        // Handle specific errors (404, 429, etc.) or general failure
        setError(data.error || `Request failed. Status: ${response.status}`);
        console.error("Request reset error:", response.status, data);
      }

    } catch (err) {
      console.error("Request reset exception:", err);
      setError('An unexpected network error occurred. Please try again.');
    }

    // Only set loading to false if an error occurred (no redirect happened)
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email address and we&apos;ll send you a code to reset your password.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
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

            {/* Display Messages */}
            {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
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