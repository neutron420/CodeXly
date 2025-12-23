// app/set-new-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

function SetNewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || ""; // Get email from URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email] = useState(emailFromQuery); // Store email from URL
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!emailFromQuery) {
        setError("Invalid request link. Email missing.");
        // Consider redirecting back or showing a more permanent error
    }
  }, [emailFromQuery]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Invalid request. Email is missing.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) { // Use the same minimum length as your API
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Password reset successfully! Redirecting to sign in...');
        setNewPassword(""); // Clear fields on success
        setConfirmPassword("");
        // Redirect to sign-in after a delay
        setTimeout(() => router.push('/signin'), 3000);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
        console.error("Reset password error:", data);
        setIsLoading(false); // Stop loading only on error
      }
    } catch (err) {
      console.error("Reset password exception:", err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false); // Stop loading on exception
    }
     // No finally block needed here if redirect happens on success
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader className="px-4 sm:px-6 pt-6 sm:pt-6 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Set New Password</CardTitle>
          <CardDescription className="text-sm">
            Enter a new password for your account associated with <span className="font-medium text-foreground break-all">{email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading || !!message} // Disable if successful or loading
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading || !!message} // Disable if successful or loading
              />
            </div>

            {message && <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 break-words">{message}</p>}
            {error && <p className="text-xs sm:text-sm text-red-500 break-words">{error}</p>}

          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-6">
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm" disabled={isLoading || !!message}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            {message && (
                <p className="text-xs sm:text-sm text-center text-muted-foreground">
                    <Link href="/signin" className="underline hover:text-primary">
                        Go to Sign In
                    </Link>
                </p>
            )}
          </CardFooter>
        </form>
      </Card>
  );
}

export default function SetNewPasswordPage() {
    // Wrap with Suspense because useSearchParams() needs it
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-8 sm:py-12">Loading...</div>}>
            <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 py-8 sm:py-12">
                <SetNewPasswordForm />
            </div>
        </Suspense>
    );
}