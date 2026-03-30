"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LabelCustomizer } from "@/components/onboarding/LabelCustomizer";
import { Button, Stepper, Group, Text, Title, Box, Paper, Stack, ThemeIcon, TextInput, rem } from "@mantine/core";
import { Briefcase, ArrowRight, CheckCircle, Settings, Laptop, Apple, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [active, setActive] = useState(0);
  
  // Custom profession state
  const [profession, setProfession] = useState("");
  const [customLabels, setCustomLabels] = useState<any[]>([
    { category: "ISSUE", label: "Incident", icon: "🚨" },
    { category: "REQUEST", label: "Request", icon: "📋" },
    { category: "CHANGE", label: "Change", icon: "🔄" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.professionalRole) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const handleQuickSelect = (roleName: string, issue: string, request: string, change: string, issueIcon: string, requestIcon: string, changeIcon: string) => {
    setProfession(roleName);
    setCustomLabels([
      { category: "ISSUE", label: issue, icon: issueIcon },
      { category: "REQUEST", label: request, icon: requestIcon },
      { category: "CHANGE", label: change, icon: changeIcon },
    ]);
  };

  const handleComplete = async () => {
    if (!profession) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          professionalRole: profession,
          customLabels: customLabels
        }),
      });
      
      if (res.ok) {
        await update({ professionalRole: profession });
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to complete onboarding. Please try again.");
      }
    } catch (e: any) {
      console.error("Onboarding failed", e);
      setError(e.message || "An unexpected error occurred.");
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
            color="dark"
            size="sm"
            allowNextStepsSelect={false}
            styles={{
              stepIcon: { border: '1px solid #e5e5e5', backgroundColor: '#fff', color: '#888' },
              stepLabel: { color: '#888', fontWeight: 600 },
              stepDescription: { color: '#bbb' },
              stepCompletedIcon: { color: '#0d0d0d' },
              separator: { backgroundColor: '#eee' }
            }}
          >
            {/* Step 1: Profession */}
            <Stepper.Step 
              label="Profession" 
              description="Tell us your role" 
              icon={<Briefcase size={16} />}
            >
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-10">
                <div className="space-y-3">
                  <Title order={1} className="text-3xl font-bold text-[#0d0d0d] tracking-tight">What is your profession?</Title>
                  <Text className="text-[#888] max-w-sm mx-auto text-sm font-medium">
                    This helps us tailor your workspace labels and icons to fit your workflow.
                  </Text>
                </div>

                <div className="w-full max-w-md space-y-4">
                  <TextInput
                    placeholder="e.g. Software Developer, Teacher, Lawyer..."
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    size="xl"
                    radius="xl"
                    className="w-full shadow-sm"
                    styles={{
                      input: {
                        textAlign: 'center',
                        fontSize: rem(16),
                        fontWeight: 600,
                        border: '2px solid #eee',
                        '&:focus': { borderColor: '#0d0d0d' },
                        height: rem(64)
                      }
                    }}
                  />
                  
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <Text size="xs" fw={700} color="dimmed" className="uppercase tracking-widest opacity-60">Try as...</Text>
                    <Group gap="sm" justify="center">
                      <Button 
                        variant="default" 
                        radius="xl" 
                        size="xs" 
                        leftSection={<Laptop size={14} />} 
                        onClick={() => handleQuickSelect("Software Coder", "Bug Report", "Feature Request", "Code Change", "🐛", "✨", "💻")}
                        className="border-[#eee] hover:border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Software Coder
                      </Button>
                      <Button 
                        variant="default" 
                        radius="xl" 
                        size="xs" 
                        leftSection={<Apple size={14} />} 
                        onClick={() => handleQuickSelect("School Teacher", "Session Issue", "Course Request", "Curriculum Change", "🍎", "📚", "🔄")}
                        className="border-[#eee] hover:border-orange-200 hover:bg-orange-50 transition-colors"
                      >
                        School Teacher
                      </Button>
                    </Group>
                  </div>
                </div>

                <Button 
                  onClick={() => setActive(1)} 
                  disabled={!profession}
                  size="lg" 
                  radius="xl"
                  className="bg-[#0d0d0d] hover:bg-[#333] px-12 h-14 shadow-lg transition-transform hover:scale-[1.02]"
                  rightSection={<ArrowRight size={20} />}
                >
                  Continue to Labels
                </Button>
              </div>
            </Stepper.Step>

            {/* Step 2: Labels */}
            <Stepper.Step 
              label="Labels" 
              description="Customize labels" 
              icon={<Settings size={16} />}
            >
              <div className="py-6 space-y-6">
                <LabelCustomizer 
                  labels={customLabels}
                  onChange={setCustomLabels}
                />

                <Group justify="center" mt="xl" pt="xl">
                  <Button variant="subtle" color="gray" onClick={() => setActive(0)} size="sm">Back</Button>
                  <Button 
                    onClick={() => setActive(2)} 
                    size="md" 
                    radius="lg"
                    className="bg-[#0d0d0d] hover:bg-[#333] px-10 h-11 shadow-md"
                    rightSection={<ArrowRight size={16} />}
                  >
                    Next: Review
                  </Button>
                </Group>
              </div>
            </Stepper.Step>

            {/* Step 3: Confirmation */}
            <Stepper.Step 
              label="Finish" 
              description="Almost there" 
              icon={<CheckCircle size={16} />}
            >
              <div className="py-12 text-center space-y-8">
                 <Box className="w-20 h-20 bg-[#fafafa] rounded-3xl mx-auto flex items-center justify-center border border-[#eee] text-3xl">
                    🚀
                 </Box>
                 <div className="space-y-3 text-center flex flex-col items-center">
                   <Title order={2} className="text-2xl font-bold text-[#0d0d0d] tracking-tight">Everything is set!</Title>
                   <Text ta="center" className="text-[#666] max-w-sm text-sm font-medium leading-relaxed">
                     Batein is now configured for your role as a <strong>{profession}</strong>.
                   </Text>
                 </div>

                 <Paper withBorder radius="2rem" p="xl" className="bg-[#fafafa] border-[#eee] max-w-sm mx-auto shadow-sm">
                    <Stack gap="lg">
                       <Text size="xs" fw={800} color="dimmed" className="uppercase tracking-[0.2em] opacity-60 text-center">Your Setup</Text>
                       <div className="space-y-4">
                         {customLabels.map((l, i) => (
                            <Group key={i} justify="apart" wrap="nowrap" className="pb-3 border-b border-white last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                 <span className="text-2xl h-10 w-10 bg-white rounded-xl shadow-sm border border-[#eee] flex items-center justify-center">
                                   {l.icon}
                                 </span>
                                 <div className="flex flex-col items-start gap-0.5">
                                   <Text size="sm" fw={800} className="text-[#0d0d0d]">{l.label}</Text>
                                   {l.category === 'CHANGE' && (
                                     <Text fw={800} color="orange" className="uppercase tracking-widest text-[8px] flex items-center gap-1" style={{ fontSize: '9px' }}>
                                        <Sparkles size={10} strokeWidth={3} /> Needs Approval
                                     </Text>
                                   )}
                                 </div>
                               </div>
                               <ThemeIcon size="sm" radius="xl" color="emerald" variant="light" className="shrink-0">
                                  <CheckCircle size={14} />
                               </ThemeIcon>
                            </Group>
                         ))}
                       </div>
                    </Stack>
                 </Paper>

                 {error && (
                   <Text color="red" size="xs" fw={700} ta="center" className="animate-pulse">
                     Error: {error}
                   </Text>
                 )}

                 <Group justify="center" mt="xl" pt="xl">
                   <Button variant="subtle" color="gray" onClick={() => setActive(1)} size="sm">Back</Button>
                   <Button 
                     onClick={handleComplete} 
                     disabled={saving}
                     loading={saving}
                     size="lg"
                     radius="xl"
                     className="bg-[#0d0d0d] hover:bg-[#333] px-12 h-14 shadow-lg"
                   >
                     Jump to Dashboard
                   </Button>
                 </Group>
              </div>
            </Stepper.Step>
          </Stepper>
        </Box>
        
        <Text size="xs" color="dimmed" ta="center" mt="xl" className="opacity-40 font-bold uppercase tracking-[0.3em]">
          The Batein Operating System
        </Text>
      </div>
    </div>
  );
}
