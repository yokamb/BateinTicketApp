import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TimeReportsClient from "./TimeReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { adminId: user.id },
    select: { id: true, name: true }
  });
  const joinedWorkspaces = await (prisma as any).instanceAccess.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true } } }
  });

  const allWorkspaces = [
    ...ownedWorkspaces,
    ...joinedWorkspaces.map((j: any) => j.workspace)
  ];

  return <TimeReportsClient workspaces={allWorkspaces} />;
}
