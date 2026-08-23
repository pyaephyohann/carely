"use client";

import { Users, Calendar, AlertCircle, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetDoctorAppointmentsQuery } from "@/store/api/appointmentApi";

export default function DoctorPatientsPage() {
  const { data, isLoading, error } = useGetDoctorAppointmentsQuery({
    filter: "all",
    page: 1,
    limit: 50,
  });

  const appointments = data?.data || [];

  // Deduplicate patients by ID
  const seenPatientIds = new Set<string>();
  const patients = appointments
    .filter((appt) => {
      if (seenPatientIds.has(appt.patient.id)) return false;
      seenPatientIds.add(appt.patient.id);
      return true;
    })
    .map((appt) => ({
      ...appt.patient,
      lastAppointment: appt.startTime,
      lastStatus: appt.status,
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Patients</h1>
        <p className="text-muted-foreground mt-1">Patients you have treated or have upcoming appointments with</p>
      </motion.div>

      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load patients"
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
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No patients yet"
              description="Patients will appear here after you have appointments with them."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patients.map((patient, idx) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar
                      firstName={patient.firstName}
                      lastName={patient.lastName}
                      src={patient.avatar}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            {patient.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {patient.phone}
                              </span>
                            )}
                            {patient.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {patient.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(patient.lastAppointment).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
