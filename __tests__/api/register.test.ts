

/** @jest-environment node */

import { POST } from "@/app/api/register/route";

// Mock NextResponse from next/server to avoid Next's web Request polyfill
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

// Mock email to avoid network and background timers
jest.mock("@/lib/email", () => ({
  __esModule: true,
  sendWelcomeEmail: jest.fn(async () => undefined),
}));

// Mock prisma client
jest.mock("@/lib/prisma", () => {
  const user = {
    findUnique: jest.fn(),
  };

  const password = {
    create: jest.fn(),
  };

  const txClient = {
    user: {
      create: jest.fn(),
    },
    password,
  };

  return {
    __esModule: true,
    default: {
      user,
      password,
      $transaction: jest.fn(async (cb: any) => cb(txClient)),
    },
  };
});

// Mock bcrypt
jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (value: string) => `hashed-${value}`),
  },
}));

const prismaMock = jest.requireMock("@/lib/prisma").default;
const bcryptMock = jest.requireMock("bcrypt").default;

describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if required fields are missing", async () => {
    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }), // missing name & password
    });

    const response = await POST(request as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: "Missing name, email, or password" });
  });

  it("creates a new user and returns 201", async () => {
    // existing user check should find nothing
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const requestBody = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    // mock user creation in transaction
    const createdUser = { id: "user-id-1", name: requestBody.name, email: requestBody.email };
    prismaMock.$transaction.mockImplementationOnce(async (cb: any) => {
      return cb({
        user: {
          create: jest.fn().mockResolvedValue(createdUser),
        },
        password: {
          create: jest.fn().mockResolvedValue({ userId: createdUser.id }),
        },
      });
    });

    const response = await POST(request as any);

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(bcryptMock.hash).toHaveBeenCalledWith("password123", 10);
    expect(data).toMatchObject({
      id: "user-id-1",
      name: "John Doe",
      email: "john@example.com",
    });
  });

  it("returns 409 if user already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "1", email: "existing@example.com" });

    const request = new Request("http://localhost/api/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Existing",
        email: "existing@example.com",
        password: "password123",
      }),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data).toEqual({ error: "User already exists" });
  });
});
