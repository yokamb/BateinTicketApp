"use client";

import { useEffect, useState } from "react";
import { Badge, Text } from "@mantine/core";

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
  category?: string; // New prop for custom categories
  professionalRole?: string;
  size?: "xs" | "sm" | "md";
}

export function TicketTypeBadge({ type, category, professionalRole, size = "xs" }: TicketTypeBadgeProps) {
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

  const normalizedType = (type || "").toUpperCase();
  const normalizedCategory = (category || "").toUpperCase();

  const matchesIssue = roleConfig
    ? normalizedType === "INCIDENT" || type === roleConfig.issueLabel || normalizedCategory === "ISSUE"
    : normalizedType === "INCIDENT" || normalizedCategory === "ISSUE";
    
  const matchesRequest = roleConfig
    ? normalizedType === "REQUEST" || type === roleConfig.requestLabel || normalizedCategory === "REQUEST"
    : normalizedType === "REQUEST" || normalizedCategory === "REQUEST";
    
  const matchesChange = roleConfig
    ? normalizedType === "CHANGE" || type === roleConfig.changeLabel || normalizedCategory === "CHANGE"
    : normalizedType === "CHANGE" || normalizedCategory === "CHANGE";

  const palette = roleConfig?.colorScheme
    ? roleConfig.colorScheme.split(",").map((c) => c.trim())
    : [];

  const label = roleConfig
    ? matchesIssue
      ? roleConfig.issueLabel
      : matchesRequest
      ? roleConfig.requestLabel
      : matchesChange
      ? roleConfig.changeLabel
      : type
    : type;

  const icon = roleConfig
    ? matchesIssue
      ? roleConfig.issueIcon
      : matchesRequest
      ? roleConfig.requestIcon
      : matchesChange
      ? roleConfig.changeIcon
      : null
    : null;

  const colorHex = roleConfig
    ? matchesIssue
      ? palette[0]
      : matchesRequest
      ? palette[1]
      : matchesChange
      ? palette[2]
      : undefined
    : undefined;

  const getFallbackColor = () => {
    if (matchesIssue) return "red";
    if (matchesRequest) return "blue";
    if (matchesChange) return "orange";
    return "gray";
  };

  return (
    <Badge 
      variant={colorHex ? "filled" : "light"}
      color={colorHex ? undefined : getFallbackColor()} 
      size={size}
      className={`font-black uppercase tracking-tighter rounded-full ${colorHex ? "border-none" : ""}`}
      leftSection={icon ? <Text size="12px">{icon}</Text> : null}
      styles={{
        root: colorHex
          ? {
              backgroundColor: colorHex,
              borderColor: colorHex,
              color: "#fff",
            }
          : undefined,
        label: { paddingLeft: icon ? '4px' : '0px' }
      }}
    >
      {label}
    </Badge>
  );
}
