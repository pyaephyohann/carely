"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const NavbarRefreshSlotContext = createContext<{
  slot: HTMLElement | null;
  setSlot: (el: HTMLElement | null) => void;
}>({ slot: null, setSlot: () => {} });

export function NavbarRefreshProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ slot, setSlot }), [slot]);

  return (
    <NavbarRefreshSlotContext.Provider value={value}>
      {children}
    </NavbarRefreshSlotContext.Provider>
  );
}

export function NavbarRefreshSlot() {
  const { setSlot } = useContext(NavbarRefreshSlotContext);

  return <div ref={setSlot} className="flex items-center" />;
}

export function NavbarRefresh({ children }: { children: ReactNode }) {
  const { slot } = useContext(NavbarRefreshSlotContext);

  if (!slot) return null;
  return createPortal(children, slot);
}
