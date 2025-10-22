// components/session-provider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function NextAuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}