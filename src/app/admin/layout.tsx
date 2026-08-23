"use client";

import { useState } from "react";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser, selectIsLoading } from "@/store/slices/authSlice";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectIsLoading);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 animate-pulse" />
        <main className="flex-1 p-8">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48 mb-6" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const firstName = (user?.profile as Record<string, string>)?.firstName || "Admin";
  const lastName = (user?.profile as Record<string, string>)?.lastName || "";

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar role="ADMIN" firstName={firstName} lastName={lastName} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50">
            <Sidebar role="ADMIN" firstName={firstName} lastName={lastName} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Carely Admin</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
