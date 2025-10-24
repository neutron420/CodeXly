// app/verify-otp/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

// Helper component to read query params safely on the client
function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || ""; // Get email from URL

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(emailFromQuery); // Use email from URL
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update email state if query param changes
  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email) {
      setError("Email address is missing. Please go back and try again.");
      setIsLoading(false);
      return;
    }
    if (!otp || otp.length !== 6) {
        setError("Please enter the 6-digit OTP.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/password/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // OTP Verified! Redirect to the set-new-password page
        router.push(`/set-new-password?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || 'Invalid or expired OTP. Please try again.');
        console.error("Verify OTP error:", data);
        setIsLoading(false); // Stop loading only on error
      }
    } catch (err) {
      console.error("Verify OTP exception:", err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false); // Stop loading on exception
    }
     // No finally block needed here if redirect happens on success
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email || "your email"}</span>.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={isLoading}
                className="text-center tracking-[0.5em]"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              <Link href="/forgot-password" className="underline hover:text-primary">
                Request a new one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
  );
}


export default function VerifyOtpPage() {
    // Wrap with Suspense because useSearchParams() needs it
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>}>
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <VerifyOtpForm />
            </div>
        </Suspense>
    );
}