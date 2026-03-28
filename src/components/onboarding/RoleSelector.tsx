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
  ActionIcon,
  Tooltip
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
    <Box className="space-y-3">
      <TextInput
        placeholder="Search for your profession..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<Search size={14} className="text-[#888]" />}
        size="md"
        radius="lg"
        styles={{
          input: {
            backgroundColor: '#fff',
            border: '1px solid #e5e5e5',
            color: '#0d0d0d',
            fontSize: rem(13),
            paddingLeft: rem(38),
            '&:focus': {
              borderColor: '#0d0d0d',
            }
          }
        }}
        className="px-4 pt-4"
      />

      <ScrollArea h={380} type="hover" offsetScrollbars className="px-4">
        <div className="grid grid-cols-1 gap-2 pb-4">
          {filteredRoles.map((role) => (
            <UnstyledButton
              key={role.id}
              onClick={() => onSelect(role)}
              className={`p-3.5 rounded-xl border transition-all duration-200 group ${
                selectedRoleName === role.roleName
                  ? "bg-[#0d0d0d] border-[#0d0d0d] text-white shadow-md shadow-black/10"
                  : "bg-white border-[#f0f0f0] hover:bg-[#fafafa] hover:border-[#ddd] text-[#0d0d0d]"
              }`}
            >
              <Group justify="apart" wrap="nowrap">
                <Group wrap="nowrap" gap="md">
                  <Box 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform ${
                      selectedRoleName === role.roleName ? "bg-white/10" : "bg-[#f3f3f3]"
                    }`}
                  >
                    {role.issueIcon}
                  </Box>
                  <Box>
                    <Text fw={700} size="sm" className={selectedRoleName === role.roleName ? "text-white" : "text-[#0d0d0d]"}>
                      {role.roleName}
                    </Text>
                    <Group gap={4} mt={3}>
                      <Badge variant="dot" size="10px" color={selectedRoleName === role.roleName ? "white" : "gray"} className={`text-[8px] uppercase tracking-tighter font-bold ${selectedRoleName === role.roleName ? "text-white opacity-80" : "text-[#888]"}`}>
                        {role.issueLabel}
                      </Badge>
                      <Badge variant="dot" size="10px" color={selectedRoleName === role.roleName ? "white" : "gray"} className={`text-[8px] uppercase tracking-tighter font-bold ${selectedRoleName === role.roleName ? "text-white opacity-80" : "text-[#888]"}`}>
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
                    <ActionIcon variant="subtle" color={selectedRoleName === role.roleName ? "gray.0" : "gray.6"} size="sm">
                       <Info size={14} className={selectedRoleName === role.roleName ? "text-white opacity-50" : ""} />
                    </ActionIcon>
                  </Tooltip>
                  {selectedRoleName === role.roleName ? (
                    <Check size={18} className="text-white" strokeWidth={3} />
                  ) : (
                    <ChevronRight size={16} className="text-[#ccc] group-hover:text-[#888] transition-colors" />
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
