"use client";

import { useEffect, useState } from "react";
import { Badge, Text, Group } from "@mantine/core";

interface RoleConfig {
  roleName: string;
  issueLabel: string;
  requestLabel: string;
  changeLabel: string;
  issueIcon: string;
  requestIcon: string;
  changeIcon: string;
  colorScheme: string;
}

interface TicketTypeBadgeProps {
  type: string;
  professionalRole?: string;
  size?: "xs" | "sm" | "md";
}

export function TicketTypeBadge({ type, professionalRole, size = "xs" }: TicketTypeBadgeProps) {
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);

  useEffect(() => {
    if (professionalRole) {
      async function fetchConfig() {
        try {
          const res = await fetch("/api/roles");
          const data = await res.json();
          const config = data.find((r: any) => r.roleName === professionalRole);
          setRoleConfig(config);
        } catch (e) {
          console.error("Failed to fetch role config for badge", e);
        }
      }
      fetchConfig();
    }
  }, [professionalRole]);

  const getLabel = () => {
    if (!roleConfig) return type;
    if (type === "INCIDENT") return roleConfig.issueLabel;
    if (type === "REQUEST") return roleConfig.requestLabel;
    if (type === "CHANGE") return roleConfig.changeLabel;
    return type;
  };

  const getIcon = () => {
    if (!roleConfig) return null;
    if (type === "INCIDENT") return roleConfig.issueIcon;
    if (type === "REQUEST") return roleConfig.requestIcon;
    if (type === "CHANGE") return roleConfig.changeIcon;
    return null;
  };

  const getColor = () => {
    if (type === "INCIDENT") return "red";
    if (type === "REQUEST") return "blue";
    if (type === "CHANGE") return "orange";
    return "gray";
  };

  return (
    <Badge 
      variant="light" 
      color={getColor()} 
      size={size}
      className={`font-black uppercase tracking-tighter rounded-full`}
      leftSection={getIcon() ? <Text size="12px">{getIcon()}</Text> : null}
      styles={{
        label: { paddingLeft: getIcon() ? '4px' : '0px' }
      }}
    >
      {getLabel()}
    </Badge>
  );
}
