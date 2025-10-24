// lib/email.ts
import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}
const resend = new Resend(resendApiKey);

// Get the 'From' address from environment variables
const senderEmail = process.env.EMAIL_FROM;
if (!senderEmail) {
  throw new Error("Missing EMAIL_FROM environment variable");
}

// Specific function for sending the password reset OTP using Resend
export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const subject = 'Your Password Reset Code';
  const textBody = `Your password reset code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.`;
  // Optional: Create a nicer HTML version
  const htmlBody = `
    <p>Your password reset code is: <strong>${otp}</strong></p>
    <p>This code will expire in 15 minutes.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: senderEmail as string, // The verified 'From' address
      to: [email],      // Recipient address
      subject: subject,
      text: textBody,   // Plain text version
      html: htmlBody,   // HTML version
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }

    console.log('Resend message sent successfully:', data?.id);

  } catch (error) {
    console.error('Error sending email via Resend:', error);
    // Re-throw the error so the API route can handle it
    if (error instanceof Error) {
        throw new Error(`Failed to send email. ${error.message}`);
    } else {
        throw new Error('Failed to send email due to an unknown error.');
    }
  }
}