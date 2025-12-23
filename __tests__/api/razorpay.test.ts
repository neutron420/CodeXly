/** @jest-environment node */

import { POST as createOrderPOST } from "@/app/api/razorpay/create-order/route";
import { POST as verifyPOST } from "@/app/api/razorpay/verify/route";

// Mock NextResponse from next/server
jest.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    private _body: any;

    constructor(body?: any, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }

    async json() {
      try {
        return JSON.parse(this._body);
      } catch {
        return this._body;
      }
    }

    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(JSON.stringify(data), init);
    }
  }

  return {
    __esModule: true,
    NextResponse: MockNextResponse,
  };
});

// Mock authOptions to avoid pulling ESM @auth/prisma-adapter into tests
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  __esModule: true,
  authOptions: {},
}));

// Mock prisma
jest.mock("@/lib/prisma", () => {
  const payment = {
    create: jest.fn(),
    updateMany: jest.fn(),
  };

  return {
    __esModule: true,
    default: {
      payment,
    },
  };
});

// Mock Razorpay client
jest.mock("@/lib/razorpay", () => {
  const orders = {
    create: jest.fn(),
  };

  return {
    __esModule: true,
    razorpay: {
      orders,
    },
  };
});

// Mock rate-limiter-flexible to avoid real rate limiting in tests
jest.mock("rate-limiter-flexible", () => {
  class RateLimiterResMock {
    msBeforeNext = 0;
    remainingPoints = 1;
  }
  class RateLimiterMemoryMock {
    async consume() {
      return new RateLimiterResMock();
    }
  }
  return {
    __esModule: true,
    RateLimiterMemory: RateLimiterMemoryMock,
    RateLimiterRes: RateLimiterResMock,
  };
});

// Mock next-auth getServerSession
jest.mock("next-auth", () => ({
  __esModule: true,
  getServerSession: jest.fn(async () => ({
    user: { id: "user-1" },
  })),
}));

const prismaMock = jest.requireMock("@/lib/prisma").default;
const razorpayMock = jest.requireMock("@/lib/razorpay").razorpay;

describe("POST /api/razorpay/create-order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/razorpay/create-order", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await createOrderPOST(req as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ error: "Missing required fields" });
  });

  it("creates an order and payment record successfully", async () => {
    (razorpayMock.orders.create as jest.Mock).mockResolvedValueOnce({
      id: "order_123",
      amount: 10000,
      currency: "INR",
    });

    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_123";

    const req = new Request("http://localhost/api/razorpay/create-order", {
      method: "POST",
      body: JSON.stringify({
        planName: "Pro",
        billingPeriod: "month",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await createOrderPOST(req as any);
    const data = await res.json();

    expect(razorpayMock.orders.create).toHaveBeenCalledWith({
      amount: 199 * 100,
      currency: "INR",
      notes: {
        planName: "Pro",
        billingPeriod: "month",
        userId: "user-1",
      },
    });

    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        razorpayOrderId: "order_123",
        amount: 10000,
        currency: "INR",
        planName: "Pro",
        billingPeriod: "month",
      },
    });

    expect(res.status).toBe(200);
    expect(data).toEqual({
      orderId: "order_123",
      amount: 10000,
      currency: "INR",
      key: "rzp_test_123",
    });
  });
});

describe("POST /api/razorpay/verify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = "secret";
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/razorpay/verify", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await verifyPOST(req as any);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: "Missing Razorpay fields",
    });
  });

  it("marks payment as FAILED when signature is invalid", async () => {
    const reqBody = {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "invalid_signature",
    };

    const req = new Request("http://localhost/api/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "content-type": "application/json" },
    });

    const res = await verifyPOST(req as any);
    const data = await res.json();

    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith({
      where: { razorpayOrderId: "order_123" },
      data: {
        status: "FAILED",
        razorpayPaymentId: "pay_123",
        razorpaySignature: "invalid_signature",
      },
    });

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: "Invalid signature",
    });
  });

  it("marks payment as SUCCESS when signature is valid", async () => {
    const crypto = await import("crypto");
    const orderId = "order_123";
    const paymentId = "pay_123";
    const secret = "secret";

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const reqBody = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature,
    };

    const req = new Request("http://localhost/api/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: { "content-type": "application/json" },
    });

    const res = await verifyPOST(req as any);
    const data = await res.json();

    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith({
      where: { razorpayOrderId: orderId },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      },
    });

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
}
);


