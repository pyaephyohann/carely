"use client";

import { Sidebar } from "@/components/layout/sidebar";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="DOCTOR" firstName="Dr." lastName="Smith" />
      <main className="flex-1 bg-zinc-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
