import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const rawUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const baseUrl = (rawUrl).trim();
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    console.log(`[Email] Attempting to send verification to: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@batein.com",
      to: email,
      subject: "Verify your Batein account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 800; color: #1e293b; margin: 0;">Welcome to Batein</h1>
            <p style="color: #64748b; margin-top: 8px;">Please verify your email to get started.</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
            <p style="color: #475569; margin: 0 0 24px;">Click the button below to verify your email address. This link expires in 24 hours.</p>
            <a href="${verifyUrl}" style="display: block; text-align: center; padding: 14px 24px; background: linear-gradient(135deg, #6366f1, #06b6d4); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
              Verify Email Address
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
              Or paste this link in your browser:<br />
              <span style="color: #6366f1;">${verifyUrl}</span>
            </p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            If you did not create a Batein account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Resend API Error:", error);
      throw error;
    }

    console.log(`[Email] Success! ID: ${data?.id}`);
  } catch (err) {
    console.error("[Email] Fatal error in sendVerificationEmail:", err);
    throw err;
  }
}

export async function sendEmailNotification(to: string, subject: string, text: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@batein.com",
      to,
      subject,
      text,
    });
    if (error) {
      console.error("[Email] Notification Error:", error);
    } else {
      console.log(`[Email] Notification Sent: ${data?.id}`);
    }
  } catch (err) {
    console.error("[Email] Notification Fatal Error:", err);
  }
}
