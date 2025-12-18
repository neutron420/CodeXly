/** @jest-environment node */

import { POST } from "@/app/api/password/request-reset/route";

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

// Mocks
jest.mock("@/lib/prisma", () => {
  const user = {
    findUnique: jest.fn(),
  };
  const passwordResetToken = {
    deleteMany: jest.fn(),
    create: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      user,
      passwordResetToken,
      $transaction: jest.fn((cb: any) => cb({ user, passwordResetToken })),
    },
  };
});

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (value: string) => `hashed-${value}`),
  },
}));

jest.mock("@/lib/email", () => ({
  __esModule: true,
  sendPasswordResetEmail: jest.fn(async () => undefined),
}));

// Mock rate-limiter-flexible so that RateLimiterMemory.consume/get work without throwing
jest.mock("rate-limiter-flexible", () => {
  class RateLimiterResMock {
    msBeforeNext = 0;
  }
  class RateLimiterMemoryMock {
    async consume() {
      return new RateLimiterResMock();
    }
    async get() {
      return null;
    }
  }
  return {
    __esModule: true,
    RateLimiterMemory: RateLimiterMemoryMock,
    RateLimiterRes: RateLimiterResMock,
  };
});

const prismaMock = jest.requireMock("@/lib/prisma").default;
const emailMock = jest.requireMock("@/lib/email");

describe("POST /api/password/request-reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const req = new Request("http://localhost/api/password/request-reset", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Email is required" });
  });

  it("returns 404 when user is not found", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/password/request-reset", {
      method: "POST",
      body: JSON.stringify({ email: "nouser@example.com" }),
    });

    const res = await POST(req as any);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "nouser@example.com" },
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ error: "No user exists with this email id" });
  });

  it("creates reset token and sends email for existing user", async () => {
    const user = { id: "user-1", email: "user@example.com" };
    prismaMock.user.findUnique.mockResolvedValueOnce(user);

    const req = new Request("http://localhost/api/password/request-reset", {
      method: "POST",
      body: JSON.stringify({ email: "USER@example.com" }),
    });

    const res = await POST(req as any);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.any(String)
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "OTP email sent successfully." });
  });
});
