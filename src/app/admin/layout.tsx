"use client";

import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser, selectIsLoading } from "@/store/slices/authSlice";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectIsLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <div className="w-64 bg-white border-r border-zinc-200 animate-pulse" />
        <main className="flex-1 bg-zinc-50 p-8">
          <div className="h-8 bg-zinc-200 rounded w-48 mb-6" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-zinc-200 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const firstName = (user?.profile as Record<string, string>)?.firstName || "Admin";
  const lastName = (user?.profile as Record<string, string>)?.lastName || "";

  return (
    <div className="flex min-h-screen">
      <Sidebar role="ADMIN" firstName={firstName} lastName={lastName} />
      <main className="flex-1 bg-zinc-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
