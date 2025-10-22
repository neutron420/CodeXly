// app/api/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return new NextResponse(JSON.stringify({ error: 'Missing name, email, or password' }), { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return new NextResponse(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- UPDATED LOGIC ---
    // Use a transaction to create User and Password together
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create the User record (without password)
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          // emailVerified: null, // Set based on your flow
        },
      });

      // 2. Create the associated Password record
      await tx.password.create({
        data: {
          hash: hashedPassword,
          userId: newUser.id, // Link to the newly created user
        },
      });

      return newUser; // Return the created user from the transaction
    });
    // --- END UPDATED LOGIC ---


    // Don't need to manually remove password field as it's not on the user object returned
    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    // Handle potential transaction errors or unique constraint violations more gracefully if needed
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
         return new NextResponse(JSON.stringify({ error: 'User already exists (transaction check)' }), { status: 409 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}