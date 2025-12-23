"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BillingPeriod = "month" | "year";

interface PaymentCheckoutProps {
  planName: string;
  billingPeriod: BillingPeriod;
  displayAmount: number;
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  order_id?: string;
  description?: string;
  notes?: Record<string, string | number | boolean | null | undefined>;
  theme?: { color?: string };
  handler?: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function PaymentCheckout({
  planName,
  billingPeriod,
  displayAmount,
}: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const startPayment = async () => {
    setError(null);
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        setError("Unable to load payment gateway. Please try again.");
        return;
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          billingPeriod,
        }),
      });

      if (!orderRes.ok) {
        setError("Failed to create order. Please try again.");
        return;
      }

      const orderData: {
        orderId: string;
        amount: number;
        currency: string;
        key: string | null;
      } = await orderRes.json();

      if (!orderData.key) {
        setError("Payment configuration error. Please contact support.");
        return;
      }

      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CodeXly",
        description: `${planName} – ${
          billingPeriod === "month" ? "Monthly" : "Yearly"
        } plan`,
        order_id: orderData.orderId,
        notes: {
          plan: planName,
          period: billingPeriod,
        },
        theme: {
          color: "#f97316",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const data = await verifyRes.json();
            if (verifyRes.ok && data.success) {
              window.location.href = `/payment/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`;
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError(
              "Something went wrong while verifying payment. Please contact support."
            );
          }
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 sm:mt-6 space-y-3">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={startPayment}
          disabled={loading}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full text-base sm:text-lg font-semibold h-11 sm:h-12",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? "Processing..." : `Pay ₹${displayAmount} securely`}
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            🔒 Payments secured by Razorpay
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            ⏱️ Don’t refresh or close during payment
          </div>
        </div>
        {error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}


