"use client";

import { ReactNode } from "react";
import { ActionProvider } from "@/context/ActionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ActionProvider>
      {children}
    </ActionProvider>
  );
}
