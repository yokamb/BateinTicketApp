import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotesClient from "./NotesClient";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let userWorkspaces = [];
  const ownedWorkspaces = await (prisma as any).workspace.findMany({ where: { adminId: user.id } });
  const joinedWorkspaces = await (prisma as any).instanceAccess.findMany({ where: { userId: user.id }, include: { workspace: true } });
  
  userWorkspaces = [
    ...ownedWorkspaces,
    ...joinedWorkspaces.map((j: any) => j.workspace)
  ];

  return (
    <div className="h-[calc(100vh-64px)] w-full animate-fade-in flex flex-col font-sans z-20 overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
        <NotesClient workspaces={userWorkspaces} currentUser={user} />
      </div>
    </div>
  );
}
