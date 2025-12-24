"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

type PremiumUnlockModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageName: string;
};

export function PremiumUnlockModal({ open, onOpenChange, languageName }: PremiumUnlockModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handlePurchase = () => {
    onOpenChange(false);
    // Redirect to home page with pricing section anchor
    router.push("/#pricing");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => onOpenChange(false)}
    >
      <Card
        className="w-full max-w-[500px] border-border/70 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Premium Feature Locked</CardTitle>
          </div>
          <CardDescription className="text-base pt-2">
            <span className="font-semibold text-foreground">{languageName}</span> is a premium language.
            Subscribe to unlock access to all premium languages and features.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What you&apos;ll get:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Access to all premium languages (TypeScript, Python, and more)</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Advanced difficulty levels and exclusive practice tracks</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Priority support and early access to new features</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handlePurchase}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              View Pricing & Purchase
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

