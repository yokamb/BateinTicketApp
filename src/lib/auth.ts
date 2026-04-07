import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Allow linking Google accounts to existing email/password accounts
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorToken: { label: "2FA Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Block login if email not verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in. Check your inbox.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Check Two-Factor Authentication
        if (user.isTwoFactorEnabled) {
          if (!credentials.twoFactorToken) {
            throw new Error("2FA_REQUIRED");
          }
          const speakeasy = await import('speakeasy');
          if (!user.twoFactorSecret || !speakeasy.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: credentials.twoFactorToken,
            window: 1
          })) {
            throw new Error("Invalid two-factor authentication code");
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          professionalRole: user.professionalRole,
        } as any;
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours session timeout
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.professionalRole = (user as any).professionalRole;
      }

      if (trigger === "update") {
        if (session?.role !== undefined) {
          token.role = session.role as string;
        }
        if (session?.professionalRole !== undefined) {
          token.professionalRole = session.professionalRole as string;
        }
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { 
            role: true, 
            professionalRole: true,
            plan: true,
            subscriptionExpiresAt: true,
            isSubscriptionCancelled: true
          },
        });

        if (dbUser) {
          let currentPlan = dbUser.plan;
          
          // Check for expiry
          if (dbUser.plan !== "FREE" && dbUser.subscriptionExpiresAt && new Date() > dbUser.subscriptionExpiresAt) {
            // Plan has expired, downgrade to FREE
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                plan: "FREE",
                isSubscriptionCancelled: false,
                subscriptionExpiresAt: null,
                paypalSubscriptionId: null,
                razorpaySubscriptionId: null,
                razorpayPaymentId: null,
              }
            });
            currentPlan = "FREE";
          }

          token.role = dbUser.role;
          token.professionalRole = dbUser.professionalRole;
          token.plan = currentPlan;
          token.subscriptionExpiresAt = dbUser.subscriptionExpiresAt;
          token.isSubscriptionCancelled = dbUser.isSubscriptionCancelled;
          token.mustChangePassword = (dbUser as any).mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).professionalRole = token.professionalRole;
        (session.user as any).plan = token.plan;
        (session.user as any).subscriptionExpiresAt = token.subscriptionExpiresAt;
        (session.user as any).isSubscriptionCancelled = token.isSubscriptionCancelled;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
