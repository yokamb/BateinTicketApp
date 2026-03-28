"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Title, Text, Stack, Box, Center, Loader, ThemeIcon } from "@mantine/core";
import { CheckCircle, XCircle, Users, Crown } from "lucide-react";
import Logo from "@/components/Logo";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setInvite(data);
      })
      .catch(() => setError("Failed to load invitation"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/tickets");
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <Center className="min-h-screen bg-[#fafafa]">
        <Loader color="dark" size="sm" />
      </Center>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 font-sans">
      <Box className="mb-8">
        <Logo />
      </Box>

      <Card radius="2rem" shadow="xl" padding="xl" className="w-full max-w-md border border-[#eee]">
        {error ? (
          <Stack align="center" gap="md" className="py-6 text-center">
            <ThemeIcon color="red" size={60} radius="xl" variant="light">
              <XCircle size={32} />
            </ThemeIcon>
            <Title order={3} className="font-black tracking-tighter uppercase">Invalid Invitation</Title>
            <Text size="sm" color="dimmed" fw={500}>{error}</Text>
            <Button variant="subtle" color="dark" radius="xl" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </Stack>
        ) : (
          <Stack gap="xl" align="center" className="py-4 text-center">
            <Box className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#0d0d0d] flex items-center justify-center text-white text-3xl font-black shadow-2xl rotate-3">
                {invite.workspace.name[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-xl shadow-lg border border-[#eee]">
                <Users size={20} className="text-[#0d0d0d]" />
              </div>
            </Box>

            <div>
              <Text size="xs" fw={800} color="dimmed" className="uppercase tracking-widest mb-1 opacity-60">Invitation to JOIN</Text>
              <Title order={2} className="text-3x font-black tracking-tighter uppercase leading-none">
                {invite.workspace.name}
              </Title>
              <Text size="sm" color="dimmed" fw={500} className="mt-4 px-4">
                <strong>{invite.workspace.admin.name || "A workspace owner"}</strong> invited you to join their team as a <strong>{invite.role}</strong>.
              </Text>
            </div>

            {invite.role === "GUEST" && (
                <Box className="bg-amber-50 border border-amber-100 p-3 rounded-2xl w-full">
                    <Text size="xs" color="amber" fw={700} className="flex items-center justify-center gap-1.5 uppercase tracking-tighter">
                        <Crown size={14} /> Client / Guest Access
                    </Text>
                    <Text fz={11} color="amber" fw={500} className="mt-1 opacity-80">
                        You'll have access to review and approve tickets in this workspace.
                    </Text>
                </Box>
            )}

            <Button 
                fullWidth 
                size="lg" 
                radius="xl" 
                color="dark" 
                loading={accepting}
                onClick={handleAccept}
                className="hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-xl"
            >
              Accept Invitation & Join
            </Button>

            <Text fz={10} color="dimmed" fw={600} className="uppercase tracking-widest opacity-40 italic">
              Expiring in 7 days
            </Text>
          </Stack>
        )}
      </Card>
      
      <Text size="xs" color="dimmed" fw={500} className="mt-8 text-center opacity-60">
        You'll need a Batein account to join. <br/>
        Accepting will link this workspace to your profile.
      </Text>
    </div>
  );
}
