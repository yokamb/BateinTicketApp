import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RecurringClient from "./RecurringClient";

export default async function RecurringPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) redirect("/login");

  const templates = await prisma.recurringTemplate.findMany({
    where: { workspace: { adminId: user.id } },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });

  const workspaces = await prisma.workspace.findMany({
    where: { adminId: user.id },
    select: { id: true, name: true }
  });

  const ticketTypes = await prisma.ticketType.findMany({
    where: { workspace: { adminId: user.id } },
    select: { id: true, label: true, category: true, workspaceId: true }
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <RecurringClient
        initialTemplates={templates as any}
        workspaces={workspaces}
        ticketTypes={ticketTypes}
        currentUserId={user.id}
      />
    </div>
  );
}
