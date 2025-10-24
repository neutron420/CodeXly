// app/api/password/request-reset/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { sendPasswordResetEmail } from '@/lib/email'; // Ensure this path is correct

// --- Rate Limiter for Requesting OTP ---
const requestRateLimiter = new RateLimiterMemory({
  points: 1,
  duration: 10 * 60, // 10 minutes between requests
  keyPrefix: 'password_reset_request',
});

// --- Rate Limiter for Blocking New OTP Requests (due to failed verify attempts) ---
const otpBlockLimiter = new RateLimiterMemory({
    points: 1,
    duration: 5 * 60, // 5 minutes block
    keyPrefix: 'otp_request_block', // MUST match the prefix in verify-otp
});
// --- End Rate Limiter Config ---

const OTP_EXPIRY_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    const lowerCaseEmail = email?.toLowerCase();

    if (!lowerCaseEmail) {
      return new NextResponse(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    // --- Check if BLOCKED from requesting due to failed attempts ---
    try {
        const blockStatus = await otpBlockLimiter.get(lowerCaseEmail);
        if (blockStatus && blockStatus.remainingPoints <= 0) {
            console.log(`OTP request blocked for email: ${lowerCaseEmail}`);
            const retryAfter = Math.ceil(blockStatus.msBeforeNext / (1000 * 60)); // Minutes
            return new NextResponse(
               JSON.stringify({ error: `Too many failed OTP attempts. Please try again in ${retryAfter} minutes.` }),
               { status: 429 }
            );
        }
    } catch (limiterError) {
        console.error("Error checking block status:", limiterError);
        // Fail cautiously if block check fails
        return new NextResponse(JSON.stringify({ error: 'Could not verify request status. Please try again later.' }), { status: 500 });
    }
    // --- End Block Check ---

    // --- Apply Standard Request Rate Limiting ---
    try {
      await requestRateLimiter.consume(lowerCaseEmail);
    } catch (rateLimiterRes) {
      if (rateLimiterRes instanceof RateLimiterRes) {
        console.log(`Request rate limit hit for email: ${lowerCaseEmail}`);
        const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
        const headers = new Headers();
        headers.set('Retry-After', String(retryAfter));
        return new NextResponse(
          JSON.stringify({ error: `Please wait ${Math.ceil(retryAfter / 60)} more minutes before requesting again.` }),
          { status: 429, headers }
        );
      }
      console.error('Request rate limiter error:', rateLimiterRes);
      return new NextResponse(JSON.stringify({ error: 'Internal server error during rate limiting.' }), { status: 500 });
    }
    // --- End Standard Request Rate Limiting ---

    // 1. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: lowerCaseEmail },
    });

    // --- If user is NOT found, return 404 status ---
    if (!user || !user.email) {
      console.log(`Password reset request for non-existent email: ${lowerCaseEmail}`);
      // Return 404 Not Found status
      return new NextResponse(
        JSON.stringify({ error: 'No user exists with this email id' }),
        { status: 404 }
      );
    }
    // --- User EXISTS, proceed below ---

    // 2. Generate OTP, Hash, Expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // 3. Store Token (delete old, create new)
    await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await tx.passwordResetToken.create({
            data: { userId: user.id, token: hashedOtp, expiresAt: expiresAt },
        });
    });

    // 4. Send Email
    try {
      await sendPasswordResetEmail(user.email, otp);
      console.log(`Password reset OTP email initiated for ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Optional: Revert rate limit
      // await requestRateLimiter.delete(lowerCaseEmail);
      return new NextResponse(JSON.stringify({ error: 'Failed to send reset email. Please try again later.' }), { status: 500 });
    }

    // 5. Return success (only if user exists and email process started)
    return NextResponse.json({ message: 'OTP email sent successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Request Password Reset Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}