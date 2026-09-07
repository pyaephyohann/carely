"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  ArrowRight,
  RefreshCw,
  Hourglass,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetDoctorDashboardQuery,
  useUpdateAppointmentStatusMutation,
  type DashboardAppointment,
} from "@/store/api/appointmentApi";
import { getStatusLabel, getStatusVariant, getValidTransitions, DOCTOR_REJECT_REASON } from "@/lib/appointment-utils";
import { formatDate, formatDateTime, formatRelativeDate } from "@/utils/date";
import { cn } from "@/utils/cn";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatApptRange(start: string, end: string) {
  return `${formatApptTime(start)} – ${formatApptTime(end)}`;
}

function AppointmentTypeIcon({ type }: { type: string }) {
  return type === "VIRTUAL" ? (
    <Video className="h-3.5 w-3.5" />
  ) : (
    <MapPin className="h-3.5 w-3.5" />
  );
}

function AppointmentActions({
  appointment,
  updatingId,
  onStatusUpdate,
}: {
  appointment: DashboardAppointment;
  updatingId: string | null;
  onStatusUpdate: (id: string, status: string, cancelReason?: string) => void;
}) {
  const transitions = getValidTransitions(appointment.status);
  const busy = updatingId === appointment.id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/doctor/appointments/${appointment.id}`}>
        <Button variant="outline" size="sm">
          View
        </Button>
      </Link>
      {transitions.includes("CONFIRMED") && (
        <Button
          size="sm"
          disabled={busy}
          isLoading={busy}
          onClick={() => onStatusUpdate(appointment.id, "CONFIRMED")}
        >
          Accept
        </Button>
      )}
      {transitions.includes("COMPLETED") && (
        <Button
          size="sm"
          disabled={busy}
          isLoading={busy}
          onClick={() => onStatusUpdate(appointment.id, "COMPLETED")}
        >
          Complete
        </Button>
      )}
      {transitions.includes("CANCELLED") && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            onStatusUpdate(
              appointment.id,
              "CANCELLED",
              appointment.status === "PENDING" ? DOCTOR_REJECT_REASON : undefined,
            )
          }
        >
          {appointment.status === "PENDING" ? "Reject" : "Cancel"}
        </Button>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentRow({
  appointment,
  updatingId,
  onStatusUpdate,
  showDate = false,
}: {
  appointment: DashboardAppointment;
  updatingId: string | null;
  onStatusUpdate: (id: string, status: string, cancelReason?: string) => void;
  showDate?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-border bg-card">
      <Avatar
        firstName={appointment.patient.firstName}
        lastName={appointment.patient.lastName}
        src={appointment.patient.avatar}
        size="md"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatRelativeDate(appointment.startTime)} · {formatDate(appointment.startTime, "MMM d")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatApptRange(appointment.startTime, appointment.endTime)}
              </span>
              <span className="flex items-center gap-1">
                <AppointmentTypeIcon type={appointment.type} />
                {appointment.type === "VIRTUAL" ? "Virtual" : "In Person"}
              </span>
            </div>
            {appointment.reason && (
              <p className="text-sm text-muted-foreground mt-1 italic truncate">
                &quot;{appointment.reason}&quot;
              </p>
            )}
          </div>
          <Badge variant={getStatusVariant(appointment.status)}>
            {getStatusLabel(appointment.status)}
          </Badge>
        </div>
        <AppointmentActions
          appointment={appointment}
          updatingId={updatingId}
          onStatusUpdate={onStatusUpdate}
        />
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useGetDoctorDashboardQuery();
  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const dashboard = data?.data;
  const doctorName = dashboard
    ? `Dr. ${dashboard.doctor.firstName} ${dashboard.doctor.lastName}`
    : "Doctor";

  const handleStatusUpdate = async (
    appointmentId: string,
    status: string,
    cancelReason?: string,
  ) => {
    setUpdatingId(appointmentId);
    try {
      await updateStatus({
        appointmentId,
        status,
        ...(cancelReason ? { cancelReason } : {}),
      }).unwrap();
    } catch {
      // Keep dashboard visible; RTK leaves previous data; error surfaces via toast-less UI
    } finally {
      setUpdatingId(null);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load dashboard"
              description="Your session is fine — we couldn't load practice data. Please try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">
            {greeting()}, {isLoading ? "…" : doctorName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your practice overview for today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Today's Appointments"
          value={dashboard?.stats.todayAppointments ?? 0}
          icon={<Calendar className="h-6 w-6" />}
          color="bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400"
          loading={isLoading}
        />
        <StatCard
          title="Pending Requests"
          value={dashboard?.stats.pendingRequests ?? 0}
          icon={<Hourglass className="h-6 w-6" />}
          color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
          loading={isLoading}
        />
        <StatCard
          title="Completed Appointments"
          value={dashboard?.stats.completedAppointments ?? 0}
          icon={<CheckCircle2 className="h-6 w-6" />}
          color="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
          loading={isLoading}
        />
        <StatCard
          title="Total Patients"
          value={dashboard?.stats.totalPatients ?? 0}
          icon={<Users className="h-6 w-6" />}
          color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
          loading={isLoading}
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Next Appointment */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="xl:col-span-1"
        >
          <Card className="h-full">
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Next Appointment</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : !dashboard?.nextAppointment ? (
                <EmptyState
                  icon={<Clock className="h-8 w-8" />}
                  title="No upcoming appointment"
                  description="You're clear for now. New bookings will show up here."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      firstName={dashboard.nextAppointment.patient.firstName}
                      lastName={dashboard.nextAppointment.patient.lastName}
                      src={dashboard.nextAppointment.patient.avatar}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {dashboard.nextAppointment.patient.firstName}{" "}
                        {dashboard.nextAppointment.patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(dashboard.nextAppointment.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusVariant(dashboard.nextAppointment.status)}>
                      {getStatusLabel(dashboard.nextAppointment.status)}
                    </Badge>
                    <Badge variant="default">
                      {dashboard.nextAppointment.type === "VIRTUAL" ? "Virtual" : "In Person"}
                    </Badge>
                  </div>
                  {dashboard.nextAppointment.reason && (
                    <p className="text-sm text-muted-foreground italic">
                      &quot;{dashboard.nextAppointment.reason}&quot;
                    </p>
                  )}
                  <AppointmentActions
                    appointment={dashboard.nextAppointment}
                    updatingId={updatingId}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="xl:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Today&apos;s Schedule</h2>
              <Link
                href="/doctor/appointments"
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              ) : !dashboard?.todaySchedule.length ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No appointments today"
                  description="Enjoy the open calendar — or update your availability."
                  action={
                    <Link href="/doctor/schedule">
                      <Button variant="outline" size="sm">
                        Manage Schedule
                      </Button>
                    </Link>
                  }
                />
              ) : (
                dashboard.todaySchedule.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appointment={appt}
                    updatingId={updatingId}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">Pending Requests</h2>
              <p className="text-sm text-muted-foreground">
                Accept or reject booking requests for your practice
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              ) : !dashboard?.pendingRequests.length ? (
                <EmptyState
                  icon={<Hourglass className="h-8 w-8" />}
                  title="No pending requests"
                  description="New patient booking requests will appear here."
                />
              ) : (
                dashboard.pendingRequests.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appointment={appt}
                    updatingId={updatingId}
                    onStatusUpdate={handleStatusUpdate}
                    showDate
                  />
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Upcoming Appointments</h2>
                <p className="text-sm text-muted-foreground">Next bookings on your calendar</p>
              </div>
              <Link
                href="/doctor/appointments"
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 shrink-0"
              >
                Full list <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))
              ) : !dashboard?.upcomingAppointments.length ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No upcoming appointments"
                  description="Confirmed and pending future visits will show here."
                />
              ) : (
                dashboard.upcomingAppointments.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appointment={appt}
                    updatingId={updatingId}
                    onStatusUpdate={handleStatusUpdate}
                    showDate
                  />
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Patients */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-foreground">Recent Patients</h2>
            <p className="text-sm text-muted-foreground">
              Patients who recently had appointments with you
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : !dashboard?.recentPatients.length ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No patient activity yet"
                description="Patients appear here after they book appointments with you."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dashboard.recentPatients.map((item) => (
                  <Link
                    key={item.patient.id}
                    href={`/doctor/appointments/${item.lastAppointmentId}`}
                    className="block"
                  >
                    <div className="p-4 rounded-xl border border-border hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm transition-all h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar
                          firstName={item.patient.firstName}
                          lastName={item.patient.lastName}
                          src={item.patient.avatar}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.patient.firstName} {item.patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeDate(item.lastAppointmentAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={getStatusVariant(item.lastStatus)}>
                          {getStatusLabel(item.lastStatus)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.lastType === "VIRTUAL" ? "Virtual" : "In Person"}
                        </span>
                      </div>
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
