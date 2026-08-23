"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme";
import { NotificationCenter } from "@/components/features/notifications";
import { cn } from "@/utils/cn";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { selectCurrentUser, selectIsAuthenticated, logout } from "@/store/slices/authSlice";

const navLinks = [
  { href: "/patient/doctors", label: "Find Doctors" },
  { href: "/#specializations", label: "Specializations" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Patient Portal",
  DOCTOR: "Doctor Portal",
  ADMIN: "Admin Portal",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      dispatch(logout());
      router.push("/login");
    } catch {
      dispatch(logout());
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profileName = user?.profile as Record<string, string> | undefined;
  const firstName = profileName?.firstName || user?.email?.split("@")[0] || "User";
  const lastName = profileName?.lastName || "";

  // Hide header on dashboard pages (they have their own sidebar)
  const isDashboard = pathname.startsWith("/patient") || pathname.startsWith("/doctor") || pathname.startsWith("/admin");
  if (isDashboard) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg">
              <Heart className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Carely</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated && user && <NotificationCenter />}
            <ThemeSwitcher />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  href={ROLE_DASHBOARDS[user.role] || "/patient/dashboard"}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Avatar firstName={firstName} lastName={lastName} size="sm" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {firstName} {lastName}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Theme + Menu */}
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
          >
            <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    pathname === link.href
                      ? "text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 px-4 space-y-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href={ROLE_DASHBOARDS[user.role] || "/patient/dashboard"}
                      className="block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full justify-start">
                        <Avatar firstName={firstName} lastName={lastName} size="sm" />
                        {ROLE_LABELS[user.role] || "Dashboard"}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      isLoading={isLoggingOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
