import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  let userPlan = "FREE";
  
  if (session?.user) {
    const userSession = session.user as any;
    const dbUser = await prisma.user.findUnique({ where: { id: userSession.id } });
    if (dbUser?.plan) {
      userPlan = dbUser.plan;
    }
  }

  return <PricingClient userPlan={userPlan} />;
}
