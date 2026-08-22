"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Video, MapPin, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetDoctorAppointmentsQuery, useUpdateAppointmentStatusMutation } from "@/store/api/appointmentApi";
import { getStatusLabel, getStatusVariant, getValidTransitions } from "@/lib/appointment-utils";
import { cn } from "@/utils/cn";

const FILTERS = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState<FilterValue>("upcoming");
  const [page, setPage] = useState(1);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);

  const { data, isLoading, error } = useGetDoctorAppointmentsQuery({ filter, page, limit: 15 });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAppointmentStatusMutation();

  const appointments = data?.data || [];
  const meta = data?.meta;

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await updateStatus({ appointmentId, status }).unwrap();
      setStatusUpdateId(null);
    } catch {
      setStatusUpdateId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Appointments</h1>
        <p className="text-muted-foreground mt-1">Manage your patient appointments</p>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              filter === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <Card><CardContent className="p-8"><EmptyState icon={<AlertCircle className="h-8 w-8 text-red-500" />} title="Couldn't load appointments" description="Something went wrong." action={<Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>} /></CardContent></Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="flex gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-24" /></div></div></CardContent></Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card><CardContent className="p-8"><EmptyState icon={<Calendar className="h-8 w-8" />} title={filter === "today" ? "No appointments today" : "No appointments"} description={filter === "today" ? "You have no appointments scheduled for today." : "Your appointments will appear here."} /></CardContent></Card>
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map((appt, idx) => {
              const validTransitions = getValidTransitions(appt.status);
              return (
                <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar firstName={appt.patient.firstName} lastName={appt.patient.lastName} src={appt.patient.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">{appt.patient.firstName} {appt.patient.lastName}</p>
                              {appt.patient.phone && <p className="text-sm text-muted-foreground">{appt.patient.phone}</p>}
                            </div>
                            <Badge variant={getStatusVariant(appt.status)}>{getStatusLabel(appt.status)}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                              {new Date(appt.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                              {new Date(appt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} — {new Date(appt.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <span className="flex items-center gap-1">
                              {appt.type === "VIRTUAL" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                              {appt.type === "VIRTUAL" ? "Virtual" : "In Person"}
                            </span>
                          </div>
                          {appt.reason && <p className="text-sm text-muted-foreground mt-2 italic">&quot;{appt.reason}&quot;</p>}

                          <div className="flex items-center gap-2 mt-3">
                            <Link href={`/doctor/appointments/${appt.id}`}>
                              <Button variant="outline" size="sm">View Details</Button>
                            </Link>
                            {validTransitions.includes("COMPLETED" as never) && (
                              <Button size="sm" onClick={() => handleStatusUpdate(appt.id, "COMPLETED")} isLoading={isUpdating && statusUpdateId === appt.id}>
                                Mark Completed
                              </Button>
                            )}
                            {validTransitions.includes("NO_SHOW" as never) && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(appt.id, "NO_SHOW")} isLoading={isUpdating && statusUpdateId === appt.id}>
                                No Show
                              </Button>
                            )}
                            {validTransitions.includes("CANCELLED" as never) && (
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleStatusUpdate(appt.id, "CANCELLED")} isLoading={isUpdating && statusUpdateId === appt.id}>
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
