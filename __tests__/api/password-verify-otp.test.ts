/** @jest-environment node */

import { POST } from "@/app/api/password/verify-otp/route";

// Mock NextResponse from next/server to avoid Turnstile / Request integration issues in tests
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
    findFirst: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      user,
      passwordResetToken,
    },
  };
});

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    compare: jest.fn(async () => true),
  },
}));

// Mock rate-limiter-flexible
jest.mock("rate-limiter-flexible", () => {
  class RateLimiterResMock {
    msBeforeNext = 0;
    remainingPoints = 1;
  }
  class RateLimiterMemoryMock {
    async consume() {
      return new RateLimiterResMock();
    }
    async get() {
      return null;
    }
    async delete() {
      return;
    }
  }
  return {
    __esModule: true,
    RateLimiterMemory: RateLimiterMemoryMock,
    RateLimiterRes: RateLimiterResMock,
  };
});

const prismaMock = jest.requireMock("@/lib/prisma").default;
const bcryptMock = jest.requireMock("bcrypt").default;

describe("POST /api/password/verify-otp", () => {
  const baseBody = {
    email: "user@example.com",
    otp: "123456",
    "cf-turnstile-response": "token",
  };

  beforeAll(() => {
    // Ensure CAPTCHA check is effectively disabled for tests
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = "";

    // Silence Turnstile-related console.error noise during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if email or otp missing", async () => {
    const req = new Request("http://localhost/api/password/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Email and OTP are required" });
  });

  it("returns 400 if otp format is invalid", async () => {
    const req = new Request("http://localhost/api/password/verify-otp", {
      method: "POST",
      body: JSON.stringify({ ...baseBody, otp: "abc" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid OTP format" });
  });

  it("returns 200 when OTP is valid", async () => {
    const user = { id: "user-1", email: "user@example.com" };
    const token = { id: "token-1", token: "hashed-otp" };
    prismaMock.user.findUnique.mockResolvedValueOnce(user);
    prismaMock.passwordResetToken.findFirst.mockResolvedValueOnce(token);
    bcryptMock.compare.mockResolvedValueOnce(true);

    const req = new Request("http://localhost/api/password/verify-otp", {
      method: "POST",
      body: JSON.stringify(baseBody),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as any);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(prismaMock.passwordResetToken.findFirst).toHaveBeenCalled();
    expect(bcryptMock.compare).toHaveBeenCalledWith("123456", "hashed-otp");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "OTP verified successfully." });
  });
});
