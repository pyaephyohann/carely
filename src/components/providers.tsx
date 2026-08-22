"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { ThemeProvider } from "@/components/theme";
import { AuthProvider } from "@/components/auth-provider";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => makeStore(), []);

  return (
    <ThemeProvider>
      <Provider store={store}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastContainer />
      </Provider>
    </ThemeProvider>
  );
}
