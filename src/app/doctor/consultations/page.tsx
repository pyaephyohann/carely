"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Calendar,
  AlertCircle,
  Search,
  ChevronRight,
  RefreshCw,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { NavbarRefresh } from "@/components/layout/navbar-refresh";
import { useGetDoctorConsultationsQuery } from "@/store/api/consultationApi";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { formatDateTime } from "@/utils/date";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DoctorConsultationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  const { data, isLoading, error, refetch, isFetching } = useGetDoctorConsultationsQuery(
    { q: debouncedSearch || undefined, page, limit: 15 },
    { refetchOnFocus: true },
  );

  const consultations = data?.data || [];
  const meta = data?.meta;
  const isSearching = debouncedSearch.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <NavbarRefresh>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </NavbarRefresh>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultations</h1>
        <p className="text-muted-foreground mt-1">
          Review visit notes, diagnoses, and prescriptions for your patients.
        </p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          placeholder="Search by patient, diagnosis, or reason for visit..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          aria-label="Search consultations"
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load consultations"
              description="Something went wrong while loading your consultations. Your session may still be valid."
              action={
                <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              }
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
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title="No consultations yet"
              description={
                isSearching
                  ? "No consultations match your search."
                  : "Completed consultations will appear here."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {consultations.map((consultation, idx) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Link
                  href={`/doctor/consultations/${consultation.id}`}
                  className="block cursor-pointer"
                >
                  <Card className="hover:shadow-sm transition-shadow group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar
                          firstName={consultation.patient?.firstName ?? ""}
                          lastName={consultation.patient?.lastName ?? ""}
                          src={consultation.patient?.avatar}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-medium text-foreground truncate">
                              {consultation.patient?.firstName} {consultation.patient?.lastName}
                            </h2>
                            {consultation.prescriptionStatus ? (
                              <Badge
                                variant={getPrescriptionStatusVariant(consultation.prescriptionStatus)}
                                size="sm"
                              >
                                {getPrescriptionStatusLabel(consultation.prescriptionStatus)}
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                No prescription
                              </Badge>
                            )}
                          </div>
                          {consultation.diagnosis && (
                            <p className="text-sm text-foreground mt-1 truncate">
                              {consultation.diagnosis}
                            </p>
                          )}
                          {consultation.appointment?.reason && (
                            <p className="text-sm text-muted-foreground mt-1 truncate italic">
                              &quot;{consultation.appointment.reason}&quot;
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {consultation.appointment?.startTime && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="sr-only">Appointment</span>
                                {formatDateTime(consultation.appointment.startTime)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="sr-only">Consultation date</span>
                              {formatShortDate(consultation.createdAt)}
                            </span>
                            {consultation.updatedAt && (
                              <span>Updated {formatShortDate(consultation.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
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
        </>
      )}
    </div>
  );
}
