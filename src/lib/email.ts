import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const rawUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const baseUrl = rawUrl.trim().replace(/\/$/, "");
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    console.log(`[Email] To: ${email} | URL: ${verifyUrl}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@batein.com",
      to: email,
      subject: "Verify your Batein account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Welcome to Batein</h1>
            <p style="color: #4b5563; margin-top: 8px;">Please verify your email to secure your account.</p>
          </div>
          <div style="background-color: #f9fafb; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px; line-height: 1.5;">Click the button below to verify your email address. This link expires in 24 hours.</p>
            
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" bgcolor="#6366f1" style="border-radius: 8px;">
                  <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border: 1px solid #6366f1; border-radius: 8px;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 8px;">Or copy and paste this link into your browser:</p>
              <p style="color: #6366f1; font-size: 13px; word-break: break-all; margin: 0;">
                <a href="${verifyUrl}" style="color: #6366f1; text-decoration: none;">${verifyUrl}</a>
              </p>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
            If you did not create a Batein account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Resend API Error:", error);
      throw error;
    }

    console.log(`[Email] Sent successfully: ${data?.id}`);
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
