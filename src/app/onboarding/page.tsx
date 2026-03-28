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
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center p-6 text-[#0d0d0d] font-sans antialiased">
      <div className="w-full max-w-2xl">
        <Box className="bg-white border border-[#e5e5e5] rounded-[2rem] p-8 md:p-12 shadow-xl shadow-black/[0.03]">
          <Stepper 
            active={active} 
            onStepClick={setActive} 
            color="dark"
            size="sm"
            styles={{
              stepIcon: { border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#888' },
              stepLabel: { color: '#888', fontWeight: 600 },
              stepDescription: { color: '#bbb' },
              stepCompletedIcon: { color: '#0d0d0d' },
              separator: { backgroundColor: '#eee' }
            }}
          >
            <Stepper.Step 
              label="Welcome" 
              description="Getting started" 
              icon={<CheckCircle size={16} />}
            >
              <div className="py-8 text-center space-y-6">
                <Box className="w-16 h-16 bg-[#f3f3f3] rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-[#eee] rotate-3">
                   <Text size="2rem">👋</Text>
                </Box>
                <div className="space-y-2">
                  <Title order={1} className="text-2xl font-bold text-[#0d0d0d] tracking-tight">Welcome to Batein!</Title>
                  <Text className="text-[#666] max-w-md mx-auto text-sm">
                    We're excited to have you. Let's customize your experience to fit your specific professional needs.
                  </Text>
                </div>
                <Button 
                  onClick={() => setActive(1)} 
                  size="md" 
                  radius="lg"
                  className="bg-[#0d0d0d] hover:bg-[#333] px-8 transition-all hover:scale-[1.02] h-11"
                  rightSection={<ArrowRight size={16} />}
                >
                  Start Customizing
                </Button>
              </div>
            </Stepper.Step>

            <Stepper.Step 
              label="Role" 
              description="Your Profession" 
              icon={<Briefcase size={16} />}
            >
              <div className="py-6 space-y-6">
                <div className="text-center">
                  <Title order={2} className="text-xl font-bold text-[#0d0d0d] tracking-tight">Select Your Profession</Title>
                  <Text size="xs" className="text-[#888] font-medium mt-1">Your workspace labels and icons will adapt to your choice.</Text>
                </div>

                <div className="bg-[#fafafa] rounded-2xl border border-[#eee] overflow-hidden">
                  <RoleSelector 
                    onSelect={(role) => setSelectedRole(role)} 
                    selectedRoleName={selectedRole?.roleName}
                  />
                </div>

                <Text size="xs" className="text-[#bbb] text-center font-medium">
                  Change role anytime under Settings → Profile.
                </Text>

                <Group justify="center" mt="xl">
                  <Button variant="subtle" color="gray" onClick={() => setActive(0)} size="sm">Back</Button>
                  <Button 
                    onClick={handleComplete} 
                    disabled={!selectedRole || saving}
                    loading={saving}
                    size="md"
                    radius="lg"
                    className="bg-[#0d0d0d] hover:bg-[#333] px-10 h-11 shadow-md"
                    rightSection={<ArrowRight size={16} />}
                  >
                    Complete Setup
                  </Button>
                </Group>
              </div>
            </Stepper.Step>
          </Stepper>
        </Box>
        
        <Text size="xs" color="dimmed" ta="center" mt="xl" className="opacity-40 font-bold uppercase tracking-widest">
          The Batein Operating System
        </Text>
      </div>
    </div>
  );
}
