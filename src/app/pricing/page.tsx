import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  let userPlan = "FREE";
  let isSubscriptionCancelled = false;
  let subscriptionExpiresAt: Date | null = null;
  
  if (session?.user) {
    const userSession = session.user as any;
    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (dbUser) {
      userPlan = dbUser.plan;
      isSubscriptionCancelled = dbUser.isSubscriptionCancelled;
      subscriptionExpiresAt = dbUser.subscriptionExpiresAt;
    }
  }

  return (
    <PricingClient 
      userPlan={userPlan} 
      isSubscriptionCancelled={isSubscriptionCancelled}
      subscriptionExpiresAt={subscriptionExpiresAt}
    />
  );
}
