import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { success: false, error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json(
      { success: false, error: "Missing signature" },
      { status: 400 }
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  type RazorpayPaymentEntity = { order_id?: string; id?: string };
  type RazorpayOrderEntity = { id?: string };
  type RazorpayWebhookEvent = {
    event?: string;
    payload?: {
      payment?: { entity?: RazorpayPaymentEntity };
      order?: { entity?: RazorpayOrderEntity };
    };
  };

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const eventType = event?.event;

  try {
    if (eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id as string | undefined;
      const paymentId = paymentEntity?.id as string | undefined;

      if (orderId && paymentId) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: paymentId,
          },
        });
      }
    } else if (eventType === "order.paid") {
      const orderEntity = event.payload?.order?.entity;
      const orderId = orderEntity?.id as string | undefined;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            status: "SUCCESS",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}


