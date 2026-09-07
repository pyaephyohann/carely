"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Pill,
  Search,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetDoctorPatientsQuery } from "@/store/api/doctorPatientApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import { cn } from "@/utils/cn";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DoctorPatientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch, isFetching } = useGetDoctorPatientsQuery(
    { q: debouncedSearch || undefined, page, limit: 15 },
    { refetchOnFocus: true },
  );

  const patients = data?.data || [];
  const meta = data?.meta;
  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1">
          Manage and view the patients you&apos;ve cared for.
        </p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search patients by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          aria-label="Search patients"
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Unable to load patients"
              description="Something went wrong while loading your patients. Your session may still be valid."
              action={
                <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Loading patients...</p>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-40" />
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
              title={isSearching ? "No patients found" : "No patients yet"}
              description={
                isSearching
                  ? "Try a different name or search term."
                  : "Patients you've cared for will appear here."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {patients.map((patient, idx) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Link
                  href={`/doctor/patients/${patient.id}`}
                  className="block cursor-pointer"
                  title={`${patient.firstName} ${patient.lastName}`}
                >
                  <Card className="hover:shadow-sm transition-shadow group">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Avatar
                            firstName={patient.firstName}
                            lastName={patient.lastName}
                            src={patient.avatar}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                              {patient.age != null && <span>{patient.age} years</span>}
                              {patient.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 shrink-0" />
                                  {patient.phone}
                                </span>
                              )}
                              {patient.email && (
                                <span className="inline-flex items-center gap-1 truncate max-w-full">
                                  <Mail className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{patient.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 sm:gap-4 text-sm shrink-0 pl-0 sm:pl-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Last visit</p>
                            {patient.lastAppointment ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">
                                  {formatShortDate(patient.lastAppointment.startTime)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Next visit</p>
                            {patient.nextAppointment ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">
                                  {formatShortDate(patient.nextAppointment.startTime)}
                                </span>
                                <Badge
                                  variant={getStatusVariant(patient.nextAppointment.status)}
                                  size="sm"
                                >
                                  {getStatusLabel(patient.nextAppointment.status)}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Appointments</p>
                            <span className="text-foreground">{patient.appointmentCount}</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Prescriptions</p>
                            <span className="inline-flex items-center gap-1 text-foreground">
                              <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                              {patient.prescriptionCount}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}

          {isFetching && !isLoading && (
            <p className="text-xs text-center text-muted-foreground">Updating patients…</p>
          )}
        </>
      )}
    </div>
  );
}
