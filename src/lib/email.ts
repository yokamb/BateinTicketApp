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

export async function sendWorkspaceInviteEmail(email: string, workspaceName: string, inviterName: string, token: string, temporaryPassword?: string) {
  try {
    const rawUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const baseUrl = rawUrl.trim().replace(/\/$/, "");
    const loginUrl = `${baseUrl}/login`;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@batein.com",
      to: email,
      subject: `You've been added to ${workspaceName} on Batein`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 800; color: #6366f1; margin-bottom: 8px;">Workspace Access Active</p>
            <h1 style="font-size: 24px; font-weight: 800; color: #0d0d0d; margin: 0; letter-spacing: -0.02em;">Welcome to ${workspaceName}</h1>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 16px; padding: 32px; border: 1px solid #eeeeee; text-align: center;">
            <p style="color: #444444; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
              <strong>${inviterName}</strong> has added you to their workspace on <strong>Batein</strong>. Your account is ready for use.
            </p>

            ${temporaryPassword ? `
            <div style="background-color: #ffffff; border: 1px solid #eeeeee; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: left;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #888888; text-transform: uppercase;">Your Login Credentials</p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a;"><strong>Login ID:</strong> ${email}</p>
              <p style="margin: 0; font-size: 14px; color: #1a1a1a;"><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>
            </div>
            ` : ''}
            
            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" bgcolor="#0d0d0d" style="border-radius: 12px;">
                  <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border: 1px solid #0d0d0d; border-radius: 12px;">
                    Sign in to Workspace
                  </a>
                </td>
              </tr>
            </table>

            <p style="color: #888888; font-size: 11px; margin-top: 24px;">Please login and update your password immediately.</p>
          </div>

          <div style="margin-top: 32px; text-align: center;">
            <p style="color: #aaaaaa; font-size: 12px;">
              Batein — Modern Ticketing & Operations
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Invite error:", error);
      throw error;
    }
  } catch (err) {
    console.error("[Email] Workspace invite fatal error:", err);
    throw err;
  }
}
