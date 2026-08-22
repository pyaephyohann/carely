"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => makeStore(), []);

  return (
    <Provider store={store}>
      {children}
      <ToastContainer />
    </Provider>
  );
}
