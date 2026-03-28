"use client";

import { useState } from "react";
import { Modal, TextInput, Select, Button, Group, Stack, Text, Box, ThemeIcon, Title, Switch } from "@mantine/core";
import { Users, Mail, Link as LinkIcon, CheckCircle, Crown, Info } from "lucide-react";

export default function InviteMemberModal({ workspaceId, opened, onClose }: { workspaceId: string, opened: boolean, onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("GUEST");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(data.inviteLink);
      } else {
        setError(data.error || "Failed to create invitation");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard!");
    }
  };

  const reset = () => {
    setEmail("");
    setRole("GUEST");
    setInviteLink(null);
    setError(null);
  };

  return (
    <Modal 
      opened={opened} 
      onClose={() => { onClose(); reset(); }} 
      title={<Title order={4} className="font-black tracking-tighter uppercase">Invite Team or Client</Title>}
      radius="2rem"
      padding="xl"
      centered
      size="sm"
    >
      {inviteLink ? (
        <Stack align="center" gap="xl" className="py-6">
          <ThemeIcon color="green" size={60} radius="xl" variant="light">
            <CheckCircle size={32} />
          </ThemeIcon>
          <div className="text-center">
            <Title order={3} className="font-black tracking-tighter uppercase mb-2">Invite Created</Title>
            <Text size="sm" color="dimmed" fw={500}>Share this link with <strong>{email}</strong> to grant them access.</Text>
          </div>
          
          <Box className="w-full bg-[#f9f9f9] border border-[#eee] p-3 rounded-2xl flex items-center justify-between gap-3">
             <Text size="xs" color="dimmed" fw={600} className="truncate flex-1 font-mono">{inviteLink}</Text>
             <Button variant="dark" size="xs" radius="xl" onClick={copyLink}>Copy Link</Button>
          </Box>

          <Button variant="light" color="dark" fullWidth radius="xl" onClick={reset}>Invite Someone Else</Button>
        </Stack>
      ) : (
        <Stack gap="md">
          <Text size="xs" color="dimmed" fw={600}>Grant someone access to your workspace by email.</Text>
          
          <TextInput 
            label={<Text size="xs" fw={900} className="uppercase tracking-widest mb-1.5 ml-1">Email Address</Text>}
            placeholder="client@company.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            radius="lg"
            size="md"
            leftSection={<Mail size={16} />}
          />

          <Select 
            label={<Text size="xs" fw={900} className="uppercase tracking-widest mb-1.5 ml-1">Access Role</Text>}
            data={[
              { value: "GUEST", label: "Client / Guest (Restricted)" },
              { value: "MEMBER", label: "Team Member" },
              { value: "ADMIN", label: "Co-Admin" },
            ]}
            value={role}
            onChange={(v) => setRole(v || "GUEST")}
            radius="lg"
            size="md"
            leftSection={<Crown size={16} />}
          />

          {role === "GUEST" ? (
             <Box className="bg-amber-50 border border-amber-100 p-3 rounded-2xl">
                <Text size="xs" color="amber" fw={700} className="flex items-center gap-1.5 uppercase tracking-tighter">
                   <Info size={14} /> Guest Policy
                </Text>
                <Text fz={11} color="amber" fw={500} className="mt-1 opacity-80 leading-relaxed">
                   Guests can ONLY see tickets labeled as <strong>"Needs Approval"</strong>. They can approve or reject them with feedback.
                </Text>
             </Box>
          ) : (
            <Box className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl">
                <Text size="xs" color="indigo" fw={700} className="flex items-center gap-1.5 uppercase tracking-tighter">
                   Full Access
                </Text>
                <Text fz={11} color="indigo" fw={500} className="mt-1 opacity-80 leading-relaxed">
                   Members have access to all tickets (Incidents, Requests, Changes) in this workspace.
                </Text>
             </Box>
          )}

          {error && <Text size="xs" color="red" ta="center" fw={700}>{error}</Text>}

          <Button 
            fullWidth 
            size="md" 
            radius="xl" 
            color="dark" 
            loading={loading}
            onClick={handleInvite}
            disabled={!email.includes("@")}
            className="mt-2"
          >
            Generate Invite Link
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
