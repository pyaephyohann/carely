"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  Shield,
  Clock,
  Award,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

const trustStats = [
  { icon: <Shield className="h-5 w-5" />, value: "100%", label: "Verified Doctors" },
  { icon: <Clock className="h-5 w-5" />, value: "24/7", label: "Scheduling" },
  { icon: <Award className="h-5 w-5" />, value: "50k+", label: "Appointments" },
];

export function Hero() {
  const { isAuthenticated, user } = useAuth();

  const ctaHref = isAuthenticated && user
    ? ROLE_DASHBOARDS[user.role] || "/patient/dashboard"
    : "/register";
  const ctaLabel = isAuthenticated ? "Go to Dashboard" : "Find a Doctor";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/80 via-white to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.08),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100/80 text-violet-700 rounded-full text-sm font-medium border border-violet-200/50">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              Trusted by thousands of patients
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1]"
          >
            Healthcare that fits{" "}
            <span className="text-violet-600">your life</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
          >
            Find trusted doctors, book appointments in seconds, and manage your
            prescriptions — all from one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href={ctaHref}>
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                {ctaLabel}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Search Bar Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 max-w-2xl mx-auto"
          >
            <Link
              href="/patient/doctors"
              className="group flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200"
            >
              <Search className="h-5 w-5 text-zinc-400 group-hover:text-violet-500 transition-colors" />
              <span className="flex-1 text-left text-zinc-500 group-hover:text-zinc-700 transition-colors">
                Search doctors, specialties, conditions...
              </span>
              <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </motion.div>

          {/* Trust Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12"
          >
            {trustStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-violet-100 text-violet-600 rounded-lg">
                  {stat.icon}
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
