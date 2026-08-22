"use client";

import Link from "next/link";
import { Stethoscope, Calendar, FileText, ClipboardList, ArrowRight, Clock, MapPin, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useGetPatientAppointmentsQuery } from "@/store/api/appointmentApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import { EmptyState } from "@/components/features/patient/empty-state";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const quickActions = [
  {
    icon: Stethoscope,
    title: "Find a Doctor",
    description: "Search for doctors by name, specialty, or availability",
    href: "/patient/doctors",
    color: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Calendar,
    title: "Appointments",
    description: "View and manage your upcoming appointments",
    href: "/patient/appointments",
    color: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  },
  {
    icon: FileText,
    title: "Prescriptions",
    description: "Check your prescriptions and medication details",
    href: "/patient/prescriptions",
    color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
    disabled: true,
  },
  {
    icon: ClipboardList,
    title: "Medical Records",
    description: "Access your medical history and records",
    href: "/patient/records",
    color: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
    disabled: true,
  },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const firstName = (user?.profile as Record<string, string>)?.firstName || "there";

  const { data: appointmentsData, isLoading: isLoadingAppointments } = useGetPatientAppointmentsQuery({
    filter: "upcoming",
    limit: 3,
  });

  const upcomingAppointments = appointmentsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">How can we help with your healthcare today?</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.disabled ? "#" : action.href}>
                <Card className={`group transition-all duration-200 h-full ${action.disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 cursor-pointer"}`}>
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    {action.disabled && (
                      <span className="inline-block mt-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Coming Soon</span>
                    )}
                    {!action.disabled && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Appointments</h2>
              {upcomingAppointments.length > 0 && (
                <Link href="/patient/appointments" className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
                  View all
                </Link>
              )}
            </div>

            {isLoadingAppointments ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-8 w-8" />}
                title="No upcoming appointments"
                description="Find a doctor and book your first appointment to get started."
                action={
                  <Link href="/patient/doctors">
                    <Button>
                      <Stethoscope className="h-4 w-4" />
                      Find a Doctor
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <Link key={appt.id} href={`/patient/appointments/${appt.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer border border-transparent hover:border-border">
                      <Avatar
                        firstName={appt.doctor.firstName}
                        lastName={appt.doctor.lastName}
                        src={appt.doctor.avatar}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                          </p>
                          <Badge variant={getStatusVariant(appt.status)} size="sm">
                            {getStatusLabel(appt.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1">
                            {appt.type === "VIRTUAL" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {appt.type === "VIRTUAL" ? "Virtual" : "In Person"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
