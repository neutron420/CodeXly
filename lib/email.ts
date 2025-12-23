// lib/email.ts
import { Resend } from "resend";

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

export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const safeName = name?.trim() || "there";
  const subject = "Welcome to CodeXly";

  const textBody = [
    `Hi ${safeName},`,
    "",
    "Welcome to CodeXly – your new space to practice, generate, and improve code.",
    "",
    "Here’s what you can do next:",
    "- Start a practice session to measure your speed and accuracy.",
    "- Explore different languages and topics to sharpen your skills.",
    "- Come back regularly to track your progress over time.",
    "",
    "If you didn’t create this account, please ignore this email.",
    "",
    "Best,",
    "The CodeXly Team",
  ].join("\n");

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
      <p>Hi ${safeName},</p>
      <p>Welcome to <strong>CodeXly</strong> – your new space to practice, generate, and improve code.</p>
      <p>Here’s what you can do next:</p>
      <ul>
        <li>Start a practice session to measure your speed and accuracy.</li>
        <li>Explore different languages and topics to sharpen your skills.</li>
        <li>Return regularly to track your improvement over time.</li>
      </ul>
      <p style="margin-top: 16px;">
        If you didn’t create this account, you can safely ignore this email.
      </p>
      <p style="margin-top: 16px;">
        Best,<br />
        <strong>The CodeXly Team</strong>
      </p>
    </div>
  `;

  await sendEmail(email, subject, textBody, htmlBody);
}

// Specific function for sending the password reset OTP using Resend
export async function sendPasswordResetEmail(
  email: string,
  otp: string
): Promise<void> {
  const subject = "Your CodeXly password reset code";
  const textBody = [
    "We received a request to reset the password for your CodeXly account.",
    "",
    `Your one-time code is: ${otp}`,
    "",
    "This code will expire in 15 minutes. Do not share this code with anyone.",
    "",
    "If you did not request a password reset, you can ignore this email and your password will stay the same.",
    "",
    "Best,",
    "The CodeXly Team",
  ].join("\n");

  const htmlBody = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
      <p>We received a request to reset the password for your <strong>CodeXly</strong> account.</p>
      <p style="margin-top: 12px;">
        Your one-time code is:<br />
        <span style="display: inline-block; margin-top: 6px; padding: 8px 12px; border-radius: 6px; background: #111827; color: #f9fafb; font-weight: 600; letter-spacing: 0.08em;">
          ${otp}
        </span>
      </p>
      <p style="margin-top: 12px;">
        This code will expire in <strong>15 minutes</strong>. Do not share this code with anyone – CodeXly support will never ask for it.
      </p>
      <p style="margin-top: 12px;">
        If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
      </p>
      <p style="margin-top: 16px;">
        Best,<br />
        <strong>The CodeXly Team</strong>
      </p>
    </div>
  `;

  await sendEmail(email, subject, textBody, htmlBody);
}

async function sendEmail(
  email: string,
  subject: string,
  text: string,
  html: string
): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: senderEmail as string,
      to: [email],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to send email. ${error.message}`);
    } else {
      throw new Error("Failed to send email due to an unknown error.");
    }
  }
}