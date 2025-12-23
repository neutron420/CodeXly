import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PaymentCheckout } from "@/components/payment-checkout";

type BillingPeriod = "month" | "year";

const PLAN_PRICING: Record<
  string,
  { month: number; year: number }
> = {
  Starter: { month: 99, year: 999 },
  Pro: { month: 199, year: 1999 },
  Enterprise: { month: 599, year: 5999 },
};

type SearchParams = Promise<{
  plan?: string;
  billing?: string;
}>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    const plan = resolved.plan ?? "";
    const billing = resolved.billing ?? "";
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(
        `/payment/checkout?plan=${encodeURIComponent(
          plan
        )}&billing=${encodeURIComponent(billing)}`
      )}`
    );
  }

  const planName = resolved.plan ?? "";
  const billingParam = resolved.billing ?? "month";
  const billingPeriod =
    billingParam === "year" ? ("year" as BillingPeriod) : ("month" as BillingPeriod);

  const planPricing = PLAN_PRICING[planName];

  if (!planPricing) {
    redirect("/");
  }

  const displayAmount = planPricing[billingPeriod];

  return (
    <div className="container py-12 sm:py-16 flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="space-y-2 mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Secure Checkout
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          Complete your CodeXly purchase
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          You’ll be redirected to Razorpay to finish payment, then returned to your confirmation.
        </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border bg-card/70 backdrop-blur p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold">
                {planName} ({billingPeriod === "month" ? "Monthly" : "Yearly"})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-semibold">
                ₹{displayAmount} / {billingPeriod}
              </span>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border/50 p-4 space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">What you get</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Full access to your selected CodeXly plan</li>
                <li>Secure Razorpay checkout with card/UPI options</li>
                <li>Instant confirmation and payment history in your account</li>
              </ul>
            </div>
            <PaymentCheckout
              planName={planName}
              billingPeriod={billingPeriod}
              displayAmount={displayAmount}
            />
          </div>

          <div className="lg:col-span-2 rounded-xl border bg-card/50 backdrop-blur p-5 sm:p-6 space-y-3">
            <p className="text-sm font-semibold text-foreground">Security & support</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✔ Payments secured by Razorpay</li>
              <li>✔ CodeXly will never ask for your OTP or card PIN</li>
              <li>✔ Need help? Reach us any time at support@codexly.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


