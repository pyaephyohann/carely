"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Pill,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetPatientPrescriptionsQuery } from "@/store/api/consultationApi";
import {
  getPrescriptionStatusLabel,
  getPrescriptionStatusVariant,
} from "@/lib/prescription-utils";
import { cn } from "@/utils/cn";

const FILTERS = [
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function PrescriptionsPage() {
  const [filter, setFilter] = useState<FilterValue>("active");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useGetPatientPrescriptionsQuery(
    { filter: filter === "all" ? undefined : filter, page, limit: 10 },
    { refetchOnFocus: true, pollingInterval: 30_000 },
  );

  const prescriptions = data?.data || [];
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            Your prescriptions and medication instructions from your doctors
          </p>
        </div>
        <Link href="/patient/doctors" className="self-start">
          <Button variant="outline" className="cursor-pointer">
            <Stethoscope className="h-4 w-4" />
            Find a Doctor
          </Button>
        </Link>
      </motion.div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
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
              title="Unable to load your prescriptions"
              description="Something went wrong while loading your prescriptions. Your session may still be valid."
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
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No prescriptions yet"
              description="Your prescriptions will appear here after your doctor provides one following a visit."
              action={
                <Link href="/patient/doctors">
                  <Button className="cursor-pointer">Find a Doctor</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {prescriptions.map((rx, idx) => (
              <motion.div
                key={rx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Link href={`/patient/prescriptions/${rx.id}`} className="block cursor-pointer">
                  <Card className="hover:shadow-sm transition-shadow group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">{rx.diagnosis}</h3>
                            <Badge variant={getPrescriptionStatusVariant(rx.status)} size="sm">
                              {getPrescriptionStatusLabel(rx.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Dr. {rx.doctor?.firstName} {rx.doctor?.lastName}
                            {rx.doctor?.specialization && ` · ${rx.doctor.specialization}`}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {rx.appointmentDate
                                ? new Date(rx.appointmentDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : new Date(rx.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Pill className="h-3.5 w-3.5" />
                              {rx.items.length}{" "}
                              {rx.items.length === 1 ? "medicine" : "medicines"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {rx.items.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {item.medicineName} {item.dosage}
                              </span>
                            ))}
                            {rx.items.length > 3 && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                +{rx.items.length - 3} more
                              </span>
                            )}
                          </div>
                          {rx.notes && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {rx.notes}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                      </div>
                      <div className="mt-3 sm:hidden">
                        <Button variant="outline" size="sm" className="w-full cursor-pointer">
                          View Details
                        </Button>
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
            <p className="text-xs text-center text-muted-foreground">Updating prescriptions…</p>
          )}
        </>
      )}
    </div>
  );
}
