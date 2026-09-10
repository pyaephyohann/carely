"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  Stethoscope,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { NavbarRefresh } from "@/components/layout/navbar-refresh";
import {
  useGetPatientAppointmentsQuery,
  useCancelPatientAppointmentMutation,
  type AppointmentListItem,
} from "@/store/api/appointmentApi";
import { getStatusVariant, getAppointmentDisplayLabel } from "@/lib/appointment-utils";
import { formatRelativeDate } from "@/utils/date";
import { cn } from "@/utils/cn";

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

const EMPTY_COPY: Record<
  FilterValue,
  { title: string; description: string; showFindDoctor?: boolean }
> = {
  upcoming: {
    title: "No upcoming appointments",
    description: "Find a doctor and book your next visit.",
    showFindDoctor: true,
  },
  pending: {
    title: "No pending requests",
    description: "Appointments waiting for doctor confirmation will appear here.",
    showFindDoctor: true,
  },
  completed: {
    title: "No completed appointments",
    description: "Finished visits will appear here after your doctor marks them complete.",
  },
  cancelled: {
    title: "No cancelled appointments",
    description: "Cancelled or declined appointments will appear here for your records.",
  },
};

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function AppointmentCard({
  appointment,
  cancelId,
  isCancelling,
  onToggleCancel,
  onConfirmCancel,
}: {
  appointment: AppointmentListItem;
  cancelId: string | null;
  isCancelling: boolean;
  onToggleCancel: (id: string | null) => void;
  onConfirmCancel: (id: string) => void;
}) {
  const canCancel = ["PENDING", "CONFIRMED"].includes(appointment.status);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar
            firstName={appointment.doctor.firstName}
            lastName={appointment.doctor.lastName}
            src={appointment.doctor.avatar}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                </p>
                {appointment.doctor.specialization && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.doctor.specialization}
                  </p>
                )}
              </div>
              <Badge variant={getStatusVariant(appointment.status)}>
                {getAppointmentDisplayLabel(appointment.status, {
                  cancelledBy: appointment.cancelledBy,
                  cancelReason: appointment.cancelReason,
                })}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatRelativeDate(appointment.startTime)} · {formatApptDate(appointment.startTime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatApptTime(appointment.startTime)} — {formatApptTime(appointment.endTime)}
              </span>
              <span className="flex items-center gap-1">
                {appointment.type === "VIRTUAL" ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                {appointment.type === "VIRTUAL" ? "Virtual" : "In Person"}
              </span>
            </div>

            {appointment.reason && (
              <p className="text-sm text-muted-foreground mt-2 italic truncate">
                &quot;{appointment.reason}&quot;
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link href={`/patient/appointments/${appointment.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
              {appointment.status === "COMPLETED" && (
                <Link href="/patient/prescriptions">
                  <Button variant="ghost" size="sm">
                    Prescriptions
                  </Button>
                </Link>
              )}
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() =>
                    onToggleCancel(cancelId === appointment.id ? null : appointment.id)
                  }
                >
                  Cancel
                </Button>
              )}
            </div>

            {cancelId === appointment.id && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  Cancel this appointment? This cannot be undone. You&apos;ll need to book again
                  if you change your mind.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onConfirmCancel(appointment.id)}
                    isLoading={isCancelling}
                  >
                    Yes, Cancel
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onToggleCancel(null)}>
                    Keep
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<FilterValue>("upcoming");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const listQuery = useGetPatientAppointmentsQuery(
    { filter, page, limit: 10 },
    { pollingInterval: 30_000, refetchOnFocus: true },
  );

  const nextQuery = useGetPatientAppointmentsQuery(
    { filter: "upcoming", page: 1, limit: 1 },
    { pollingInterval: 30_000, refetchOnFocus: true },
  );

  const [cancelAppointment, { isLoading: isCancelling }] =
    useCancelPatientAppointmentMutation();

  const appointments = listQuery.data?.data || [];
  const meta = listQuery.data?.meta;
  const nextAppointment = nextQuery.data?.data?.[0] || null;
  const isRefreshing = listQuery.isFetching || nextQuery.isFetching;

  const handleRefresh = () => {
    void listQuery.refetch();
    void nextQuery.refetch();
  };

  const handleCancel = async (appointmentId: string) => {
    setCancelError(null);
    try {
      await cancelAppointment({ appointmentId }).unwrap();
      setCancelId(null);
    } catch {
      setCancelError("Unable to cancel this appointment. Please try again.");
      setCancelId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage upcoming visits, pending requests, and past care.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          <NavbarRefresh>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </NavbarRefresh>
          <Link href="/patient/doctors">
            <Button className="cursor-pointer">
              <Stethoscope className="h-4 w-4" />
              Find a Doctor
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Next / nearest upcoming */}
      {(nextQuery.isLoading || nextAppointment) && filter === "upcoming" && page === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-violet-50/80 to-transparent dark:from-violet-950/20">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold text-foreground">Next Appointment</h2>
            </CardHeader>
            <CardContent>
              {nextQuery.isLoading ? (
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ) : nextAppointment ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar
                    firstName={nextAppointment.doctor.firstName}
                    lastName={nextAppointment.doctor.lastName}
                    src={nextAppointment.doctor.avatar}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        Dr. {nextAppointment.doctor.firstName}{" "}
                        {nextAppointment.doctor.lastName}
                      </p>
                      <Badge variant={getStatusVariant(nextAppointment.status)}>
                        {getAppointmentDisplayLabel(nextAppointment.status, {
                          cancelledBy: nextAppointment.cancelledBy,
                          cancelReason: nextAppointment.cancelReason,
                        })}
                      </Badge>
                    </div>
                    {nextAppointment.doctor.specialization && (
                      <p className="text-sm text-muted-foreground">
                        {nextAppointment.doctor.specialization}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatRelativeDate(nextAppointment.startTime)} ·{" "}
                        {formatApptDate(nextAppointment.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatApptTime(nextAppointment.startTime)} —{" "}
                        {formatApptTime(nextAppointment.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        {nextAppointment.type === "VIRTUAL" ? (
                          <Video className="h-3.5 w-3.5" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5" />
                        )}
                        {nextAppointment.type === "VIRTUAL"
                          ? "Virtual consultation"
                          : "In-person visit"}
                      </span>
                    </div>
                    {nextAppointment.status === "PENDING" && (
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Waiting for the doctor to confirm this request.
                      </p>
                    )}
                  </div>
                  <Link href={`/patient/appointments/${nextAppointment.id}`}>
                    <Button variant="outline" size="sm">
                      View Details <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {cancelError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {cancelError}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
              setCancelId(null);
              setCancelError(null);
            }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
              filter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {listQuery.error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Unable to load your appointments"
              description="Your session is fine — we couldn't load appointment data. Please try again."
              action={
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="cursor-pointer"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  Retry
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : listQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title={EMPTY_COPY[filter].title}
              description={EMPTY_COPY[filter].description}
              action={
                EMPTY_COPY[filter].showFindDoctor ? (
                  <Link href="/patient/doctors">
                    <Button>Find a Doctor</Button>
                  </Link>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map((appt, idx) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <AppointmentCard
                  appointment={appt}
                  cancelId={cancelId}
                  isCancelling={isCancelling}
                  onToggleCancel={setCancelId}
                  onConfirmCancel={handleCancel}
                />
              </motion.div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}

          {isRefreshing && !listQuery.isLoading && (
            <p className="text-xs text-center text-muted-foreground">Updating appointments…</p>
          )}
        </>
      )}
    </div>
  );
}
