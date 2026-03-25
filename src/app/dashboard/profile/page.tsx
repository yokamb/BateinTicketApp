import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileForm from "./ProfileForm";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userSession = session?.user as any;

  // Fetch fresh user data
  const user = await prisma.user.findUnique({ where: { id: userSession.id } });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-1">Update your personal details and email.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
         <ProfileForm user={user} />
      </div>
    </div>
  );
}
