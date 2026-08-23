"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Activity,
  Pill,
  UserCircle,
  Heart,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
import { NotificationCenter } from "@/components/features/notifications";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser, selectIsLoading } from "@/store/slices/authSlice";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  { href: "/doctor/schedule", label: "My Schedule", icon: Settings },
  { href: "/doctor/patients", label: "Patients", icon: Users, disabled: true },
  { href: "/doctor/consultations", label: "Consultations", icon: Activity, disabled: true },
  { href: "/doctor/prescriptions", label: "Prescriptions", icon: Pill, disabled: true },
  { href: "/doctor/profile", label: "Profile", icon: UserCircle },
];

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectIsLoading);
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block w-64 border-r border-border animate-pulse" />
        <main className="flex-1 p-8">
          <div className="h-8 bg-muted rounded w-48 mb-6" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const firstName = (user?.profile as Record<string, string>)?.firstName || "Doctor";
  const lastName = (user?.profile as Record<string, string>)?.lastName || "";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex h-screen flex-col sticky top-0 bg-card border-r border-border"
      >
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg flex-shrink-0">
              <Heart className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold text-foreground whitespace-nowrap">
                  Carely
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  item.disabled
                    ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                    : isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                )}
                title={collapsed ? item.label : undefined}
                aria-disabled={item.disabled}
              >
                <span className="flex-shrink-0"><Icon className="h-5 w-5" /></span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">
                      {item.label}
                      {item.disabled && <span className="ml-1.5 text-[10px] text-zinc-400 dark:text-zinc-600">Soon</span>}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar firstName={firstName} lastName={lastName} size="sm" />
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Dr. {firstName} {lastName}</p>
                  <p className="text-xs text-muted-foreground capitalize">Doctor</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 md:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center"><Heart className="h-5 w-5 text-white" fill="currentColor" /></div>
                  <span className="text-lg font-bold text-foreground">Carely</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      onClick={() => !item.disabled && setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        item.disabled ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed" : isActive ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400" : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.disabled && <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Soon</span>}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-3 py-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar firstName={firstName} lastName={lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Dr. {firstName} {lastName}</p>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-zinc-500" onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); router.push("/login"); }}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-md md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center"><Heart className="h-3.5 w-3.5 text-white" fill="currentColor" /></div>
            <span className="font-bold text-foreground text-sm">Carely</span>
          </Link>
          <NotificationCenter />
        </div>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
