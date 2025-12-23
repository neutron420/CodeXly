import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  searchParams: {
    orderId?: string;
    paymentId?: string;
  };
};

export default async function PaymentSuccessPage({ searchParams }: SearchParams) {
  const { orderId, paymentId } = searchParams;

  if (!orderId) {
    return (
      <div className="container py-16">
        <h1 className="text-3xl font-bold mb-4">Payment status</h1>
        <p className="text-muted-foreground">Missing order id.</p>
        <Link href="/" className="text-primary underline mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!payment) {
    return (
      <div className="container py-16">
        <h1 className="text-3xl font-bold mb-4">Payment status</h1>
        <p className="text-muted-foreground">No payment found for this order.</p>
        <Link href="/" className="text-primary underline mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  const amountInr = (payment.amount ?? 0) / 100;

  return (
    <div className="container py-16 space-y-4">
      <h1 className="text-3xl font-bold">Payment status</h1>
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <span
            className={
              payment.status === "SUCCESS"
                ? "text-green-600 font-semibold"
                : payment.status === "FAILED"
                  ? "text-red-600 font-semibold"
                  : "text-amber-600 font-semibold"
            }
          >
            {payment.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Plan</span>
          <span className="font-medium">
            {payment.planName} ({payment.billingPeriod})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-medium">
            ₹{amountInr} {payment.currency}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Order ID</span>
          <span className="font-mono text-xs">{payment.razorpayOrderId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment ID</span>
          <span className="font-mono text-xs">
            {payment.razorpayPaymentId ?? paymentId ?? "Pending"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Updated</span>
          <span className="font-mono text-xs">
            {payment.updatedAt.toISOString()}
          </span>
        </div>
      </div>
      <Link href="/" className="text-primary underline inline-block">
        Back to home
      </Link>
    </div>
  );
}

