// app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({ error: "Missing name, email, or password" }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: "User already exists" }),
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to create User and Password together
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
        },
      });

      await tx.password.create({
        data: {
          hash: hashedPassword,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    // Fire-and-forget welcome email (do not block registration on email failure)
    sendWelcomeEmail(user.email ?? "", user.name ?? undefined).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return new NextResponse(
        JSON.stringify({ error: "User already exists (transaction check)" }),
        { status: 409 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(
      JSON.stringify({ error: errorMessage }),
      { status: 500 }
    );
  }
}