// app/api/password/verify-otp/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// --- Rate Limiter Config (Keep your existing limiters) ---
const otpAttemptLimiter = new RateLimiterMemory({
  points: 3,
  duration: 15 * 60,
  keyPrefix: 'otp_verify_attempt',
});
const otpBlockLimiter = new RateLimiterMemory({
    points: 1,
    duration: 5 * 60,
    keyPrefix: 'otp_request_block',
});
// --- End Rate Limiter Config ---


// --- Cloudflare Turnstile Verification Function ---
async function verifyTurnstileToken(token: string | undefined | null, remoteIp?: string | null): Promise<boolean> {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY environment variable is not set. CAPTCHA verification skipped (unsafe).');
        // !! In production, you should likely return false here unless explicitly configured otherwise.
        // For development, you might allow it to pass, but log a warning.
        // return false;
        return true; // TEMPORARY for dev if key is missing, REMOVE FOR PRODUCTION
    }

    if (!token) {
        console.warn('No Turnstile token provided by client.');
        return false;
    }

    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    try {
        const response = await fetch(verificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: secretKey,
                response: token,
                // Include remote IP if available (enhances security)
                ...(remoteIp && { remoteip: remoteIp }),
            }),
            // Add a timeout to prevent hanging requests
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
            console.error(`Turnstile verification request failed with status: ${response.status}`);
            return false;
        }

        const data: { success: boolean; 'error-codes'?: string[]; hostname?: string; action?: string; cdata?: string } = await response.json();

        if (data.success) {
            console.log(`Turnstile verification successful for hostname: ${data.hostname}`);
            return true;
        } else {
            console.warn('Turnstile verification failed. Error codes:', data['error-codes']?.join(', '));
            return false;
        }
    } catch (error) {
        console.error('Error during Turnstile verification fetch:', error);
        return false; // Fail verification on network errors or timeouts
    }
}
// --- End Turnstile Verification Function ---


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, 'cf-turnstile-response': turnstileToken } = body; // Extract Turnstile token
    const lowerCaseEmail = email?.toLowerCase();

    // --- Verify Turnstile Token FIRST ---
    // Try to get the user's IP address (might vary depending on deployment environment)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || null;
    const isHuman = await verifyTurnstileToken(turnstileToken, ip);
    if (!isHuman) {
        console.warn(`CAPTCHA verification failed for email: ${lowerCaseEmail ?? 'unknown'} from IP: ${ip ?? 'unknown'}`);
        // Consider rate limiting failed CAPTCHA attempts separately if needed
        return new NextResponse(
            JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }),
            { status: 403 } // 403 Forbidden is appropriate
        );
    }
    // --- End Turnstile Verification ---


    // Proceed only if CAPTCHA passed
    if (!lowerCaseEmail || !otp) {
      return new NextResponse(JSON.stringify({ error: 'Email and OTP are required' }), { status: 400 });
    }
    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
        return new NextResponse(JSON.stringify({ error: 'Invalid OTP format' }), { status: 400 });
    }

    // --- Your Existing Rate Limiting and OTP Logic ---
    try {
        await otpAttemptLimiter.consume(lowerCaseEmail, 0); // Check points
    } catch (rateLimiterRes) {
         if (rateLimiterRes instanceof RateLimiterRes) {
            const blockStatus = await otpBlockLimiter.get(lowerCaseEmail);
             if (blockStatus && blockStatus.remainingPoints <= 0) {
                 return new NextResponse(
                    JSON.stringify({ error: `Too many failed attempts. Please request a new code after ${Math.ceil(blockStatus.msBeforeNext / (1000 * 60))} minutes.` }),
                    { status: 429 }
                 );
            }
             return new NextResponse(JSON.stringify({ error: 'Too many attempts. Invalid OTP.' }), { status: 429 });
         }
         console.error('Rate limiter check error:', rateLimiterRes);
         return new NextResponse(JSON.stringify({ error: 'Server error during rate limit check.' }), { status: 500 });
    }

    const user = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
    if (!user) {
        console.log(`OTP verification attempt for non-existent email: ${lowerCaseEmail}`);
        try { await otpAttemptLimiter.consume(lowerCaseEmail, 1); } catch {} // Consume attempt
        return new NextResponse(JSON.stringify({ error: 'Invalid OTP or email' }), { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
    });

    if (!resetToken) {
      console.log(`No valid reset token found for user: ${lowerCaseEmail}`);
      try { await otpAttemptLimiter.consume(lowerCaseEmail, 1); } catch {} // Consume attempt
      return new NextResponse(JSON.stringify({ error: 'Invalid or expired OTP' }), { status: 400 });
    }

    const isOtpValid = await bcrypt.compare(otp, resetToken.token);

    if (!isOtpValid) {
      console.log(`Invalid OTP provided for user: ${lowerCaseEmail}`);
      try {
        await otpAttemptLimiter.consume(lowerCaseEmail, 1); // Consume attempt
      } catch (rateLimiterRes) {
         if (rateLimiterRes instanceof RateLimiterRes) {
            console.log(`Blocking OTP requests for email: ${lowerCaseEmail} for 5 minutes.`);
            try { await otpBlockLimiter.consume(lowerCaseEmail); } catch { /* ignore */ }
            return new NextResponse(
               JSON.stringify({ error: `Too many failed attempts. Please request a new code in 5 minutes.` }),
               { status: 429 }
            );
         }
      }
      return new NextResponse(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
    }
    // --- End Existing Logic ---


    // --- OTP is valid ---
    // Delete the used token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    // Reset the attempt counter on success
    try { await otpAttemptLimiter.delete(lowerCaseEmail); } catch { /* ignore */ }

    console.log(`OTP verified successfully for user: ${lowerCaseEmail}`);
    return NextResponse.json({ message: 'OTP verified successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Verify OTP API Error:', error);
    
    return new NextResponse(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
  }
}