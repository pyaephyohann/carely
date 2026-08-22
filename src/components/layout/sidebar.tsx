"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  Heart,
  Stethoscope,
  Pill,
  Building2,
  ClipboardList,
  UserCircle,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { toggleSidebarCollapsed, selectSidebarCollapsed } from "@/store/slices/uiSlice";
import { Avatar } from "@/components/ui/avatar";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { href: "/patient/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/patient/doctors", label: "Find Doctors", icon: <Stethoscope className="h-5 w-5" /> },
    { href: "/patient/appointments", label: "Appointments", icon: <Calendar className="h-5 w-5" /> },
    { href: "/patient/prescriptions", label: "Prescriptions", icon: <FileText className="h-5 w-5" /> },
    { href: "/patient/records", label: "Medical Records", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/patient/profile", label: "Profile", icon: <UserCircle className="h-5 w-5" /> },
  ],
  DOCTOR: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/doctor/appointments", label: "Appointments", icon: <Calendar className="h-5 w-5" /> },
    { href: "/doctor/patients", label: "Patients", icon: <Users className="h-5 w-5" /> },
    { href: "/doctor/consultations", label: "Consultations", icon: <Activity className="h-5 w-5" /> },
    { href: "/doctor/prescriptions", label: "Prescriptions", icon: <Pill className="h-5 w-5" /> },
    { href: "/doctor/profile", label: "Profile", icon: <UserCircle className="h-5 w-5" /> },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="h-5 w-5" /> },
    { href: "/admin/doctors", label: "Doctors", icon: <Stethoscope className="h-5 w-5" /> },
    { href: "/admin/pharmacies", label: "Pharmacies", icon: <Building2 className="h-5 w-5" /> },
    { href: "/admin/appointments", label: "Appointments", icon: <Calendar className="h-5 w-5" /> },
    { href: "/admin/medicines", label: "Medicines", icon: <Pill className="h-5 w-5" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export function Sidebar({ role, firstName = "User", lastName = "" }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const items = roleNavItems[role];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg flex-shrink-0">
            <Heart className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap"
              >
                Carely
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="px-3 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Avatar firstName={firstName} lastName={lastName} size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {firstName} {lastName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{role.toLowerCase()}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => dispatch(toggleSidebarCollapsed())}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
