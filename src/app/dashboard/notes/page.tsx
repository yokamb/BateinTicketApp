import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotesClient from "./NotesClient";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  let userWorkspaces = [];
  if (user.role === "ADMIN") {
    userWorkspaces = await prisma.workspace.findMany({ where: { adminId: user.id } });
  } else {
    const accesses = await prisma.instanceAccess.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    userWorkspaces = accesses.map((a: any) => a.workspace);
  }

  return (
    <div className="h-full w-full animate-fade-in flex flex-col font-sans z-20">
      <div className="flex-1 min-h-0 flex flex-col bg-white">
        <NotesClient workspaces={userWorkspaces} currentUser={user} />
      </div>
    </div>
  );
}
