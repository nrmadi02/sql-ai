"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";

type NuqsProviderProps = {
  children: React.ReactNode;
};

function NuqsProvider({ children }: NuqsProviderProps) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}

export { NuqsProvider };
