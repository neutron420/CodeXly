import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

type BillingPeriod = "month" | "year";

const PLAN_PRICING: Record<
  string,
  { month: number; year: number }
> = {
  Starter: { month: 99, year: 999 },
  Pro: { month: 199, year: 1999 },
  Enterprise: { month: 599, year: 5999 },
};

type CreateOrderRequestBody = {
  planName?: string;
  billingPeriod?: BillingPeriod;
};

const createOrderLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60, // 5 orders per minute per user
  keyPrefix: "razorpay_create_order",
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Rate limit per user
  try {
    await createOrderLimiter.consume(userId);
  } catch (rateLimiterRes) {
    if (rateLimiterRes instanceof RateLimiterRes) {
      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
      const headers = new Headers();
      headers.set("Retry-After", String(retryAfter));
      return new NextResponse(
        JSON.stringify({
          error: "Too many payment attempts. Please try again in a minute.",
        }),
        { status: 429, headers }
      );
    }
    return NextResponse.json(
      { error: "Rate limiting failed" },
      { status: 500 }
    );
  }

  const body = (await request.json()) as CreateOrderRequestBody;
  const { planName, billingPeriod } = body;

  if (!planName || !billingPeriod) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const planPricing = PLAN_PRICING[planName];
  if (!planPricing || !(billingPeriod in planPricing)) {
    return NextResponse.json(
      { error: "Invalid plan or billing period" },
      { status: 400 }
    );
  }

  const amountInr = planPricing[billingPeriod];
  const options = {
    amount: Math.round(amountInr * 100), // in paise
    currency: "INR" as const,
    notes: {
      planName,
      billingPeriod,
      userId,
    },
  };

  try {
    const order = await razorpay.orders.create(options);

    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id as string,
        amount: Number(order.amount),
        currency: String(order.currency),
        planName,
        billingPeriod,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
