"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RoleSelector } from "@/components/onboarding/RoleSelector";
import { Button, Stepper, Group, Text, Title, Box } from "@mantine/core";
import { Briefcase, ArrowRight, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.professionalRole) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const handleComplete = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          professionalRole: selectedRole.roleName,
          roleId: selectedRole.id 
        }),
      });
      
      if (res.ok) {
        await update({ professionalRole: selectedRole.roleName });
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Onboarding failed", e);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-2xl relative z-10">
        <Box className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <Stepper 
            active={active} 
            onStepClick={setActive} 
            color="indigo"
            size="sm"
            styles={{
              stepIcon: { border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'transparent' },
              stepLabel: { color: 'rgba(255, 255, 255, 0.5)' },
              stepCompletedIcon: { color: '#6366f1' },
              separator: { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <Stepper.Step 
              label="Welcome" 
              description="Getting started" 
              icon={<CheckCircle size={18} />}
            >
              <div className="py-8 text-center space-y-6">
                <Box className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 rotate-3">
                   <Text size="3rem">👋</Text>
                </Box>
                <div className="space-y-2">
                  <Title order={1} className="text-3xl font-black text-white tracking-tight">Welcome to Batein!</Title>
                  <Text className="text-indigo-200/60 max-w-md mx-auto">
                    We're excited to have you. Let's customize your experience to fit your specific professional needs.
                  </Text>
                </div>
                <Button 
                  onClick={() => setActive(1)} 
                  size="xl" 
                  radius="xl"
                  className="bg-indigo-600 hover:bg-indigo-500 px-8 transition-all hover:scale-105"
                  rightSection={<ArrowRight size={18} />}
                >
                  Start Customizing
                </Button>
              </div>
            </Stepper.Step>

            <Stepper.Step 
              label="Role" 
              description="Your Profession" 
              icon={<Briefcase size={18} />}
            >
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <Title order={2} className="text-2xl font-black text-white tracking-tight">Select Your Profession</Title>
                  <Text size="sm" className="text-indigo-200/50">Your workspace labels and icons will adapt to your choice.</Text>
                </div>

                <RoleSelector 
                  onSelect={(role) => setSelectedRole(role)} 
                  selectedRoleName={selectedRole?.roleName}
                />

                <Text size="xs" className="text-indigo-200/60 text-center">
                  Change role anytime under Settings → Profile.
                </Text>

                <Group justify="center" mt="xl">
                  <Button variant="subtle" color="indigo" onClick={() => setActive(0)}>Back</Button>
                  <Button 
                    onClick={handleComplete} 
                    disabled={!selectedRole || saving}
                    loading={saving}
                    size="md"
                    radius="md"
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-10"
                    rightSection={<ArrowRight size={16} />}
                  >
                    Complete Setup
                  </Button>
                </Group>
              </div>
            </Stepper.Step>
          </Stepper>
        </Box>
        
        <Text size="xs" color="dimmed" ta="center" mt="xl" className="opacity-30">
          Powered by Batein SaaS Architecture
        </Text>
      </div>
    </div>
  );
}
