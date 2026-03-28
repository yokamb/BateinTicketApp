"use client";

import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <SessionProvider>{children}</SessionProvider>
    </MantineProvider>
  );
}
