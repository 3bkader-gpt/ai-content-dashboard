import { createContext, useContext, type ReactNode } from "react";

const CompactTableContext = createContext(false);

export function CompactTableProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <CompactTableContext.Provider value={value}>{children}</CompactTableContext.Provider>;
}

export function useCompactTable(): boolean {
  return useContext(CompactTableContext);
}
