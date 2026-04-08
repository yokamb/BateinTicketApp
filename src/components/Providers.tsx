"use client";

import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import React from "react";
import ForcePasswordReset from "./ForcePasswordReset";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <SessionProvider>
        <ForcePasswordReset />
        {children}
      </SessionProvider>
    </MantineProvider>
  );
}
