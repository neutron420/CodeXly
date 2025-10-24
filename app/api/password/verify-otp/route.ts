// app/api/password/verify-otp/route.ts
import { NextResponse, type NextRequest } from 'next/server'; // Use NextRequest
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// --- Rate Limiter for OTP Verification Attempts ---
// Allow 3 attempts per 15 minutes (or OTP expiry duration) per email
const otpAttemptLimiter = new RateLimiterMemory({
  points: 3, // Max 3 attempts
  duration: 15 * 60, // Window duration (e.g., 15 minutes, matching OTP expiry)
  keyPrefix: 'otp_verify_attempt',
});

// --- Rate Limiter for Blocking New OTP Requests ---
// Block for 5 minutes after too many failed attempts
const otpBlockLimiter = new RateLimiterMemory({
    points: 1, // Only needs 1 point to block
    duration: 5 * 60, // Block duration (5 minutes)
    keyPrefix: 'otp_request_block',
});
// --- End Rate Limiter Config ---


export async function POST(request: NextRequest) { // Use NextRequest
  try {
    const body = await request.json();
    const { email, otp } = body;
    const lowerCaseEmail = email?.toLowerCase(); // Use consistent key

    if (!lowerCaseEmail || !otp) {
      return new NextResponse(JSON.stringify({ error: 'Email and OTP are required' }), { status: 400 });
    }
    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
        return new NextResponse(JSON.stringify({ error: 'Invalid OTP format' }), { status: 400 });
    }

    // --- Check if user is currently blocked from verifying OTP (due to past failures) ---
    try {
        await otpAttemptLimiter.consume(lowerCaseEmail, 0); // Check points without consuming
    } catch (rateLimiterRes) {
         if (rateLimiterRes instanceof RateLimiterRes) {
            console.log(`OTP verification attempt blocked for email: ${lowerCaseEmail}`);
            // Check if they are also blocked from requesting a new one
            const blockStatus = await otpBlockLimiter.get(lowerCaseEmail);
            if (blockStatus && blockStatus.remainingPoints <= 0) {
                 return new NextResponse(
                    JSON.stringify({ error: `Too many failed attempts. Please request a new code after ${Math.ceil(blockStatus.msBeforeNext / (1000 * 60))} minutes.` }),
                    { status: 429 }
                 );
            }
             // If not blocked from requesting, just say invalid OTP for now
             return new NextResponse(JSON.stringify({ error: 'Too many attempts. Invalid OTP.' }), { status: 429 });
         }
         console.error('Rate limiter check error:', rateLimiterRes);
         return new NextResponse(JSON.stringify({ error: 'Server error during rate limit check.' }), { status: 500 });
    }
    // --- End Check ---


    // Find user and token (as before)
    const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
    if (!user) {
        console.log(`OTP verification attempt for non-existent email: ${lowerCaseEmail}`);
        // Consume a point even for non-existent user to prevent email enumeration combined with brute force
        try { await otpAttemptLimiter.consume(lowerCaseEmail, 1); } catch {}
        return new NextResponse(JSON.stringify({ error: 'Invalid OTP or email' }), { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
    });

    // Handle invalid/expired token *before* checking OTP match
    if (!resetToken) {
      console.log(`No valid reset token found for user: ${lowerCaseEmail}`);
      // Consume a point as this is a failed attempt against the user
       try { await otpAttemptLimiter.consume(lowerCaseEmail, 1); } catch {}
      return new NextResponse(JSON.stringify({ error: 'Invalid or expired OTP' }), { status: 400 });
    }

    // Compare OTP
    const isOtpValid = await bcrypt.compare(otp, resetToken.token);

    if (!isOtpValid) {
      console.log(`Invalid OTP provided for user: ${lowerCaseEmail}`);
      // --- Consume a point on failure ---
      try {
        await otpAttemptLimiter.consume(lowerCaseEmail, 1);
      } catch (rateLimiterRes) {
         if (rateLimiterRes instanceof RateLimiterRes) {
            // Reached the limit (3 failures) - Block requesting new OTP
            console.log(`Blocking OTP requests for email: ${lowerCaseEmail} for 5 minutes.`);
            try {
                // Block the user for 5 minutes using the block limiter
                await otpBlockLimiter.consume(lowerCaseEmail);
            } catch (blockError) {
                console.error("Error setting block limiter:", blockError);
            }
            // Inform user they are blocked from requesting a new code
            return new NextResponse(
               JSON.stringify({ error: `Too many failed attempts. Please request a new code in 5 minutes.` }),
               { status: 429 } // Too Many Requests
            );
         }
         // Handle other potential errors from consume
         console.error('Rate limiter consume error:', rateLimiterRes);
      }
      // --- End Consume ---
      return new NextResponse(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
    }

    // OTP is valid!
    // Delete the used token (as before)
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    // Optional: Reset the attempt counter on success
    try {
        await otpAttemptLimiter.delete(lowerCaseEmail);
    } catch(err) {
        console.warn("Could not reset attempt limiter on success:", err)
    }

    console.log(`OTP verified successfully for user: ${lowerCaseEmail}`);
    return NextResponse.json({ message: 'OTP verified successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}