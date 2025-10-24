// app/api/password/reset/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// Rate Limiter: Allow 5 reset attempts per 15 minutes per email
const rateLimiterReset = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // 15 minutes
  keyPrefix: 'password_reset_final',
});

const MIN_PASSWORD_LENGTH = 6; // Set your minimum password length

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body; // Assumes frontend sends email after OTP verification

    if (!email || !newPassword) {
      return new NextResponse(JSON.stringify({ error: 'Email and new password are required' }), { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return new NextResponse(JSON.stringify({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` }), { status: 400 });
    }

    // Apply Rate Limiting by Email
    try {
      await rateLimiterReset.consume(email.toLowerCase());
    } catch (rateLimiterRes) {
      if (rateLimiterRes instanceof RateLimiterRes) {
        console.log(`Password reset rate limit hit for email: ${email}`);
        const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
        const headers = new Headers();
        headers.set('Retry-After', String(retryAfter));
        return new NextResponse(
          JSON.stringify({ error: `Too many reset attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.` }),
          { status: 429, headers }
        );
      }
      console.error('Rate limiter error during reset:', rateLimiterRes);
      return new NextResponse(JSON.stringify({ error: 'Internal server error during rate limiting.' }), { status: 500 });
    }

    // 1. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      console.log(`Password reset attempt for non-existent email: ${email}`);
      return new NextResponse(JSON.stringify({ error: 'Invalid request or user not found' }), { status: 400 });
    }

    // 2. Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update (or create) the password hash in the 'Password' table
    await prisma.password.upsert({
        where: { userId: user.id },
        update: { hash: newHashedPassword },
        create: { userId: user.id, hash: newHashedPassword },
    });

    console.log(`Password successfully reset for user: ${email}`);

    // 4. Return success
    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Reset Password Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}