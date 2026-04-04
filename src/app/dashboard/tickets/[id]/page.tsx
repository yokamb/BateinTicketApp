import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TicketDetailClient from "./TicketDetailClient";
import BackButton from "@/components/BackButton";


export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) redirect("/login");

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: true,
      workspace: {
        include: { customers: true }
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      },
      attachments: true,
      linkedFrom: { include: { source: true } },
      linkedTo: { include: { target: true } }
    }
  });

  if (!ticket) {
    redirect("/dashboard/tickets");
  }

  // Security check
  // Security check: must be owner or invited customer
  const isOwner = ticket.workspace.adminId === user.id;
  const access = await prisma.instanceAccess.findUnique({
    where: { workspaceId_userId: { workspaceId: ticket.workspaceId, userId: user.id } }
  });
  
  const hasAccess = isOwner || !!access;

  if (!hasAccess) {
    redirect("/dashboard/tickets");
  }

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="max-w-4xl mx-auto animate-fade-in">
          <BackButton label="All Tickets" />
          <TicketDetailClient 
              ticket={ticket} 
              currentUser={user} 
          />
      </div>
    </div>
  );
}
