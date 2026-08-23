"use client";

import Link from "next/link";
import { Activity, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetDoctorAppointmentsQuery } from "@/store/api/appointmentApi";

export default function DoctorConsultationsPage() {
  // Use completed appointments to show consultations
  const { data, isLoading, error } = useGetDoctorAppointmentsQuery({
    filter: "past",
    page: 1,
    limit: 50,
  });

  const appointments = data?.data || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultations</h1>
        <p className="text-muted-foreground mt-1">Review your past consultations and patient records</p>
      </motion.div>

      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load consultations"
              description="Something went wrong."
              action={<Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>}
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
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
              icon={<Activity className="h-8 w-8" />}
              title="No consultations yet"
              description="Consultations will appear here after you complete appointments with patients."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt, idx) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Link href={`/doctor/appointments/${appt.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar
                        firstName={appt.patient.firstName}
                        lastName={appt.patient.lastName}
                        src={appt.patient.avatar}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {appt.patient.firstName} {appt.patient.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(appt.startTime).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {appt.reason && (
                            <span className="truncate italic">&quot;{appt.reason}&quot;</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
