"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Video, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import {
  useGetPatientAppointmentsQuery,
  useCancelPatientAppointmentMutation,
} from "@/store/api/appointmentApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import { cn } from "@/utils/cn";

const FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<FilterValue>("upcoming");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading, error } = useGetPatientAppointmentsQuery({
    filter,
    page,
    limit: 10,
  });

  const [cancelAppointment, { isLoading: isCancelling }] =
    useCancelPatientAppointmentMutation();

  const appointments = data?.data || [];
  const meta = data?.meta;

  const handleCancel = async (appointmentId: string) => {
    try {
      await cancelAppointment({ appointmentId }).unwrap();
      setCancelId(null);
    } catch {
      setCancelId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Appointments</h1>
        <p className="text-muted-foreground mt-1">View and manage your appointments</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              filter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load appointments"
              description="Something went wrong while loading your appointments."
              action={<Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>}
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="flex gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-32" /></div></div></CardContent></Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title={filter === "upcoming" ? "No upcoming appointments" : filter === "past" ? "No past appointments" : filter === "cancelled" ? "No cancelled appointments" : "No appointments yet"}
              description={
                filter === "upcoming"
                  ? "Find a doctor and book your next appointment."
                  : "Your appointments will appear here."
              }
              action={
                filter === "upcoming" ? (
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
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar
                        firstName={appt.doctor.firstName}
                        lastName={appt.doctor.lastName}
                        src={appt.doctor.avatar}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                            </p>
                            {appt.doctor.specialization && (
                              <p className="text-sm text-muted-foreground">{appt.doctor.specialization}</p>
                            )}
                          </div>
                          <Badge variant={getStatusVariant(appt.status)}>
                            {getStatusLabel(appt.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })} — {new Date(appt.endTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            {appt.type === "VIRTUAL" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {appt.type === "VIRTUAL" ? "Virtual" : "In Person"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {["PENDING", "CONFIRMED"].includes(appt.status) && (
                            <>
                              <Link href={`/patient/appointments/${appt.id}`}>
                                <Button variant="outline" size="sm">View Details</Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => setCancelId(cancelId === appt.id ? null : appt.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {["COMPLETED", "NO_SHOW"].includes(appt.status) && (
                            <Link href={`/patient/appointments/${appt.id}`}>
                              <Button variant="outline" size="sm">View Details</Button>
                            </Link>
                          )}
                        </div>

                        {/* Cancel Confirmation */}
                        {cancelId === appt.id && (
                          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                              Are you sure you want to cancel this appointment?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleCancel(appt.id)}
                                isLoading={isCancelling}
                              >
                                Yes, Cancel
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setCancelId(null)}>
                                Keep
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
