"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export function CTASection() {
  const { isAuthenticated, user } = useAuth();

  const ctaHref = isAuthenticated && user
    ? ROLE_DASHBOARDS[user.role] || "/patient/dashboard"
    : "/register";
  const ctaLabel = isAuthenticated ? "Go to Dashboard" : "Get Started Free";

  return (
    <section className="py-20 bg-zinc-900 dark:bg-zinc-950 relative overflow-hidden border-t border-zinc-800 dark:border-zinc-800">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600/20 rounded-2xl mb-6">
            <Heart className="h-7 w-7 text-violet-400" fill="currentColor" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Take control of your healthcare
          </h2>
          <p className="mt-5 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Find the right doctor, book your appointment, and manage your health
            — all in one place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={ctaHref}>
              <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-violet-600 hover:bg-violet-500">
                {ctaLabel}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-base px-8 text-zinc-300 hover:text-white hover:bg-zinc-800 dark:hover:bg-zinc-800"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
