"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  Stethoscope,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Pill,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetPatientMedicalRecordsQuery } from "@/store/api/consultationApi";
import { getStatusLabel, getStatusVariant } from "@/lib/appointment-utils";
import {
  getRecordTypeLabel,
  PATIENT_MEDICAL_RECORD_FILTERS,
  type PatientMedicalRecordFilter,
} from "@/lib/patient-medical-record-utils";
import { cn } from "@/utils/cn";

const FILTERS = PATIENT_MEDICAL_RECORD_FILTERS.map((value) => ({
  value,
  label:
    value === "all"
      ? "All"
      : value.charAt(0).toUpperCase() + value.slice(1),
}));

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecordsPage() {
  const [filter, setFilter] = useState<PatientMedicalRecordFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useGetPatientMedicalRecordsQuery(
    { page, limit: 10, filter },
    { refetchOnFocus: true, pollingInterval: 30_000 },
  );

  const records = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Medical Records</h1>
          <p className="text-muted-foreground mt-1">
            Your health history and care information in one place.
          </p>
        </div>
        <Link href="/patient/doctors" className="self-start">
          <Button variant="outline" className="cursor-pointer">
            <Stethoscope className="h-4 w-4" />
            Find a Doctor
          </Button>
        </Link>
      </motion.div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-full overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFilter(f.value);
              setPage(1);
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

      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Unable to load your medical records"
              description="Something went wrong while loading your records. Your session may still be valid."
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No medical records yet"
              description="Your completed visits and clinical information will appear here."
              action={
                <Link href="/patient/doctors">
                  <Button className="cursor-pointer">
                    <Stethoscope className="h-4 w-4" />
                    Find a Doctor
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {isFetching && !isLoading && (
            <p className="text-xs text-muted-foreground">Refreshing records…</p>
          )}
          <div className="space-y-3">
            {records.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Link href={`/patient/records/${record.id}`} className="block cursor-pointer">
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                          {record.hasPrescription ? (
                            <Pill className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground truncate">{record.title}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {record.doctor
                                  ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`
                                  : "Doctor unavailable"}
                                {record.doctor?.specialization &&
                                  ` · ${record.doctor.specialization}`}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>

                          {record.summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {record.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatVisitDate(record.visitDate)}
                            </span>
                            {record.appointmentStatus && (
                              <Badge variant={getStatusVariant(record.appointmentStatus)} size="sm">
                                {getStatusLabel(record.appointmentStatus)}
                              </Badge>
                            )}
                            <Badge variant="default" size="sm">
                              {getRecordTypeLabel(record.recordType)}
                            </Badge>
                            {record.hasPrescription && (
                              <Badge variant="info" size="sm">
                                {record.prescriptionCount === 1
                                  ? "Prescription"
                                  : `${record.prescriptionCount} Prescriptions`}
                              </Badge>
                            )}
                            {record.followUpDate && (
                              <Badge variant="warning" size="sm">
                                Follow-up {formatVisitDate(record.followUpDate)}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-3">
                            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                              View Details
                            </span>
                          </div>
                        </div>
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
