/** @jest-environment node */

import { POST } from "@/app/api/password/reset/route";

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
  const password = {
    upsert: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      user,
      password,
    },
  };
});

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (value: string) => `hashed-${value}`),
  },
}));

jest.mock("rate-limiter-flexible", () => {
  class RateLimiterResMock {
    msBeforeNext = 0;
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

const prismaMock = jest.requireMock("@/lib/prisma").default;
const bcryptMock = jest.requireMock("bcrypt").default;

describe("POST /api/password/reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email or newPassword missing", async () => {
    const req = new Request("http://localhost/api/password/reset", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Email and new password are required" });
  });

  it("returns 400 when password is too short", async () => {
    const req = new Request("http://localhost/api/password/reset", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", newPassword: "123" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Password must be at least 6 characters long" });
  });

  it("updates password and returns 200 for valid request", async () => {
    const user = { id: "user-1", email: "user@example.com" };
    prismaMock.user.findUnique.mockResolvedValueOnce(user);

    const req = new Request("http://localhost/api/password/reset", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", newPassword: "newpass123" }),
    });

    const res = await POST(req as any);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(bcryptMock.hash).toHaveBeenCalledWith("newpass123", 10);
    expect(prismaMock.password.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: { hash: expect.stringContaining("hashed-") },
      create: { userId: "user-1", hash: expect.stringContaining("hashed-") },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "Password has been reset successfully." });
  });
});
