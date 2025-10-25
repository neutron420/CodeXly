// app/verify-otp/page.tsx
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import Turnstile from 'react-turnstile';

// Helper component to read query params safely on the client
function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null); 
  const turnstileRef = useRef(null); 

  // Retrieve Site Key from environment variable
  const turnstileSiteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "0x4AAAAAAB8n2rPuyQbc1otO";

  // Effect to redirect if email is missing
  useEffect(() => {
    if (!emailFromQuery) {
      router.replace('/forgot-password');
    } else {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery, router]);

  // Effect to check if Turnstile Site Key is configured
  useEffect(() => {
    if (!turnstileSiteKey) {
        console.error("Cloudflare Turnstile Site Key is not configured in .env (NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY). CAPTCHA will not work.");
        setError("CAPTCHA configuration error. Please contact support.");
    }
  }, [turnstileSiteKey]);


  // Prevent rendering form until email is confirmed (avoids flash before redirect)
  if (!emailFromQuery) {
      return <div className="text-muted-foreground">Redirecting...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validation
    if (!email) {
      setError("Email address is missing. Please go back and try again.");
      return;
    }
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (!turnstileToken) {
      setError("CAPTCHA verification failed or is missing. Please wait or try again.");
      if (turnstileRef.current) {
        
(turnstileRef.current as { reset: () => void }).reset();
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/password/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include the turnstile token in the request body
        body: JSON.stringify({
            email,
            otp,
            'cf-turnstile-response': turnstileToken // Standard key name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // OTP Verified! Redirect to the set-new-password page
        router.push(`/set-new-password?email=${encodeURIComponent(email)}`);
      } else {
        // Handle errors from the backend (invalid OTP, rate limit, CAPTCHA failure)
        setError(data.error || 'Verification failed. Please try again.');
        console.error("Verify OTP error:", response.status, data);
        // Reset Turnstile on error so the user can try again
        setTurnstileToken(null); // Clear the token state
        if (turnstileRef.current) {

          (turnstileRef.current as { reset: () => void }).reset();
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Verify OTP exception:", err);
      setError('An unexpected network error occurred. Please try again.');
      setTurnstileToken(null); // Clear token on error
      if (turnstileRef.current) {

        (turnstileRef.current as { reset: () => void }).reset();
      }
      setIsLoading(false);
    }
    // No finally block needed here if redirect happens on success
  };

  // Render an error state if the site key is missing
  if (!turnstileSiteKey) {
      return (
          <Card className="w-full max-w-md">
             <CardHeader><CardTitle>Configuration Error</CardTitle></CardHeader>
             <CardContent><p className="text-sm text-red-500">The CAPTCHA service is not configured correctly. Please contact support.</p></CardContent>
             <CardFooter>
                <Link href="/forgot-password" className="w-full">
                    Go Back
                </Link>
             </CardFooter>
          </Card>
      );
  }

  // --- Main Form Render ---
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
            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (error) setError(null); // Clear error on typing
                }}
                maxLength={6}
                required
                disabled={isLoading}
                className="text-center tracking-[0.5em]" // Style for OTP look
                aria-invalid={!!error && !error.startsWith("CAPTCHA")} // Indicate error except for CAPTCHA specific ones initially
                aria-describedby={error ? "otp-error" : undefined}
              />
            </div>

            <div className="flex justify-center pt-2">
                <Turnstile
                    id="turnstile-widget"
                    sitekey={turnstileSiteKey}
                    onSuccess={(token) => {
                        console.log("Turnstile success", token);
                        setTurnstileToken(token);
                        if (error && error.startsWith("CAPTCHA")) setError(null); // Clear CAPTCHA specific errors
                    }}
                    onError={() => {
                        console.error("Turnstile error callback triggered");
                        setError("CAPTCHA challenge failed. Please refresh or try again.");
                        setTurnstileToken(null);
                    }}
                    onExpire={() => {
                        console.log("Turnstile expired callback triggered");
                        setError("CAPTCHA challenge expired. Please retry.");
                        setTurnstileToken(null);
                    }}
                    theme="auto"
                    refreshExpired="auto"
                />
            </div>

            {/* Error Message Area */}
            {error && <p id="otp-error" className="text-sm text-red-500 pt-1 text-center">{error}</p>}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            {/* Link to request new code */}
            <p className="text-sm text-center text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="underline hover:text-primary"> {/* Pass email back */}
                Request a new one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
  );
}


// --- Main Page Component (Wrapper with Suspense) ---
export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>}>
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <VerifyOtpForm />
            </div>
        </Suspense>
    );
}