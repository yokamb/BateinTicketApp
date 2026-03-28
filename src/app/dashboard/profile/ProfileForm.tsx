"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Save, Lock, Eye, EyeOff, Edit2 } from "lucide-react";
import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";
import { Modal, Button, Group, Text, Box, Title } from "@mantine/core";
import { RoleSelector } from "@/components/onboarding/RoleSelector";

export default function ProfileForm({ user }: { user: any }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [professionalRole, setProfessionalRole] = useState(user.professionalRole || "");
  const [roleConfig, setRoleConfig] = useState<any>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: "success"|"error"} | null>(null);

  useEffect(() => {
    if (professionalRole) {
      fetchRoleConfig(professionalRole);
    }
  }, [professionalRole]);

  const fetchRoleConfig = async (roleName: string) => {
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      const config = data.find((r: any) => r.roleName === roleName);
      setRoleConfig(config);
    } catch (e) {
      console.error("Failed to fetch role config", e);
    }
  };

  // Change Password state
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{text: string, type: "success"|"error"} | null>(null);

  const router = useRouter();
  const { update: updateSession } = useSession();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, professionalRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to update profile", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: any) => {
    setProfessionalRole(role.roleName);
    setRoleConfig(role);
    setIsRoleModalOpen(false);
    
    // Auto-save role change
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalRole: role.roleName }),
      });
      await updateSession?.({ professionalRole: role.roleName });
      setMessage({ text: "Role updated successfully!", type: "success" });
      router.refresh();
    } catch (e) {
      console.error("Failed to save role", e);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will be downgraded to the Free plan immediately.")) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Subscription cancelled. You have been moved to the Free plan.", type: "success" });
        router.refresh();
      } else {
        setMessage({ text: data.error || "Failed to cancel subscription", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    const pwError = validatePassword(newPw);
    if (pwError) { setPwMessage({ text: pwError, type: "error" }); return; }
    if (newPw !== confirmPw) { setPwMessage({ text: "New passwords do not match.", type: "error" }); return; }

    setPwLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage({ text: "Password changed successfully!", type: "success" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setTimeout(() => setPwSection(false), 2000);
      } else {
        setPwMessage({ text: data.error || "Failed to change password", type: "error" });
      }
    } catch (err: any) {
      setPwMessage({ text: err.message || "Something went wrong", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const defaultPalette = ["#6366f1", "#0ea5e9", "#f97316"];
  const rolePalette = roleConfig?.colorScheme
    ? roleConfig.colorScheme.split(",").map((c: string) => c.trim())
    : defaultPalette;
  const getRoleColor = (index: number) => rolePalette[index] || defaultPalette[index];

  return (
    <div className="space-y-8">
      {/* Profile Form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {message && (
          <div className={`p-4 rounded-xl border text-sm font-medium ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-800 mb-4">Professional Role & Ticket Labels</label>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Box className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-indigo-200">
                  {roleConfig?.issueIcon || "👤"}
                </Box>
                <div>
                   <Text fw={800} size="lg" className="text-slate-900 leading-tight">
                    {professionalRole || "No Role Selected"}
                   </Text>
                   <Text size="xs" color="dimmed">Global ticket naming convention</Text>
                </div>
              </div>

              {roleConfig && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div
                    className="p-3 rounded-lg border shadow-sm text-white"
                    style={{ backgroundColor: getRoleColor(0), borderColor: getRoleColor(0) }}
                  >
                    <Text size="10px" fw={700} className="uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>Issues</Text>
                    <Group gap="xs">
                       <Text size="lg">{roleConfig.issueIcon}</Text>
                       <Text fw={600} size="sm">{roleConfig.issueLabel}</Text>
                    </Group>
                  </div>
                  <div
                    className="p-3 rounded-lg border shadow-sm text-white"
                    style={{ backgroundColor: getRoleColor(1), borderColor: getRoleColor(1) }}
                  >
                    <Text size="10px" fw={700} className="uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>Requests</Text>
                    <Group gap="xs">
                       <Text size="lg">{roleConfig.requestIcon}</Text>
                       <Text fw={600} size="sm">{roleConfig.requestLabel}</Text>
                    </Group>
                  </div>
                  <div
                    className="p-3 rounded-lg border shadow-sm text-white"
                    style={{ backgroundColor: getRoleColor(2), borderColor: getRoleColor(2) }}
                  >
                    <Text size="10px" fw={700} className="uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>Changes</Text>
                    <Group gap="xs">
                       <Text size="lg">{roleConfig.changeIcon}</Text>
                       <Text fw={600} size="sm">{roleConfig.changeLabel}</Text>
                    </Group>
                  </div>
                </div>
              )}
            </div>

            <Button 
              variant="light" 
              color="indigo" 
              leftSection={<Edit2 size={16} />}
              onClick={() => setIsRoleModalOpen(true)}
              className="mt-4 md:mt-0"
              radius="md"
            >
              Edit Role
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-3">Update your role anytime to instantly refresh ticket labels, icons, and colors.</p>

          <Modal 
            opened={isRoleModalOpen} 
            onClose={() => setIsRoleModalOpen(false)} 
            title={<Title order={4}>Select Your Professional Role</Title>}
            size="lg"
            radius="lg"
            padding="xl"
            overlayProps={{
              backgroundOpacity: 0.55,
              blur: 3,
            }}
            styles={{
              header: { backgroundColor: 'transparent' },
              content: { backgroundColor: '#0f172a', color: 'white' }
            }}
          >
            <RoleSelector 
              selectedRoleName={professionalRole}
              onSelect={handleRoleSelect}
            />
          </Modal>
        </div>

        {/* Subscription */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Subscription Details</h3>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Current Plan</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-sm font-bold text-slate-900">{user.plan || "FREE"}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(user.plan === "FREE" || !user.plan) && (
                <>
                  <button type="button" onClick={() => router.push('/pricing')} disabled={loading} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-sm">Upgrade to Pro ($2/mo)</button>
                  <button type="button" onClick={() => router.push('/pricing')} disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-sm">Get Max ($6/mo)</button>
                </>
              )}
              {user.plan === "PRO" && (
                <>
                  <button type="button" onClick={() => router.push('/pricing')} disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-sm">Upgrade to Max ($6/mo)</button>
                  <button type="button" onClick={handleCancel} disabled={loading} className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors disabled:opacity-70">{loading ? "Cancelling..." : "Cancel Subscription"}</button>
                </>
              )}
              {user.plan === "MAX" && (
                <button type="button" onClick={handleCancel} disabled={loading} className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors disabled:opacity-70">{loading ? "Cancelling..." : "Cancel Subscription"}</button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]">
            <Save size={18} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Change Password Section */}
      <div className="border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg"><Lock size={18} className="text-slate-600" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <p className="text-sm text-slate-500">Min. 8 characters, letters & numbers required</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setPwSection(!pwSection); setPwMessage(null); }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            {pwSection ? "Cancel" : "Change"}
          </button>
        </div>

        {pwSection && (
          <form onSubmit={handleChangePassword} className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5 animate-fade-in-up">
            {pwMessage && (
              <div className={`p-3 rounded-lg border text-sm font-medium ${pwMessage.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                {pwMessage.text}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  placeholder="Min. 8 chars, letters & numbers"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPw} dark={false} />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow ${
                  confirmPw && confirmPw !== newPw ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
                placeholder="Re-enter new password"
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pwLoading || (!!confirmPw && confirmPw !== newPw)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
