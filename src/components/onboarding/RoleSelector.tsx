"use client";

import { useState, useEffect } from "react";
import { 
  TextInput, 
  UnstyledButton, 
  Group, 
  Text, 
  ScrollArea, 
  Badge, 
  Box,
  rem,
  Card,
  Tooltip,
  ActionIcon
} from "@mantine/core";
import { Search, ChevronRight, Info, Check } from "lucide-react";

interface RoleConfig {
  id: string;
  roleName: string;
  issueLabel: string;
  requestLabel: string;
  changeLabel: string;
  issueIcon: string;
  requestIcon: string;
  changeIcon: string;
  colorScheme: string;
}

interface RoleSelectorProps {
  onSelect: (role: RoleConfig) => void;
  selectedRoleName?: string;
}

export function RoleSelector({ onSelect, selectedRoleName }: RoleSelectorProps) {
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        const data = await res.json();
        setRoles(data);
      } catch (e) {
        console.error("Failed to fetch roles", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="space-y-4">
      <TextInput
        placeholder="Search for your profession..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<Search size={16} />}
        size="md"
        radius="xl"
        styles={{
          input: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            '&:focus': {
              borderColor: '#6366f1',
            }
          }
        }}
      />

      <ScrollArea h={400} type="hover" offsetScrollbars>
        <div className="grid grid-cols-1 gap-3 pr-2">
          {filteredRoles.map((role) => (
            <UnstyledButton
              key={role.id}
              onClick={() => onSelect(role)}
              className={`p-4 rounded-2xl border transition-all duration-200 group ${
                selectedRoleName === role.roleName
                  ? "bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <Group justify="apart" wrap="nowrap">
                <Group wrap="nowrap">
                  <Box 
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
                  >
                    {role.issueIcon}
                  </Box>
                  <Box>
                    <Text fw={700} size="sm" className="text-white group-hover:text-indigo-300 transition-colors">
                      {role.roleName}
                    </Text>
                    <Group gap={6} mt={4}>
                      <Badge variant="dot" size="xs" color="blue" className="text-[9px] uppercase tracking-tighter">
                        {role.issueLabel}
                      </Badge>
                      <Badge variant="dot" size="xs" color="teal" className="text-[9px] uppercase tracking-tighter">
                        {role.requestLabel}
                      </Badge>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="xs">
                  <Tooltip 
                    label={
                      <div className="p-2 space-y-1">
                        <Text fw={700} size="xs">{role.roleName} Tickets:</Text>
                        <Text size="xs">• {role.issueLabel} {role.issueIcon}</Text>
                        <Text size="xs">• {role.requestLabel} {role.requestIcon}</Text>
                        <Text size="xs">• {role.changeLabel} {role.changeIcon}</Text>
                      </div>
                    }
                    position="left"
                    withArrow
                    multiline
                    w={200}
                  >
                    <ActionIcon variant="subtle" color="slate" size="sm">
                       <Info size={14} />
                    </ActionIcon>
                  </Tooltip>
                  {selectedRoleName === role.roleName ? (
                    <Check size={20} className="text-indigo-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                  )}
                </Group>
              </Group>
            </UnstyledButton>
          ))}
        </div>
      </ScrollArea>
    </Box>
  );
}
