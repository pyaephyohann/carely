"use client";

import { useState } from "react";
import {
  ClipboardList,
  Calendar,
  Stethoscope,
  AlertCircle,
  FileText,
  Pill,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetPatientMedicalRecordsQuery } from "@/store/api/consultationApi";


// =============================================================================
// Record Type Helpers
// =============================================================================

function getRecordTypeIcon(type: string) {
  switch (type) {
    case "VISIT_NOTE":
      return <Stethoscope className="h-4 w-4" />;
    case "LAB_RESULT":
      return <FileText className="h-4 w-4" />;
    case "PRESCRIPTION":
      return <Pill className="h-4 w-4" />;
    default:
      return <ClipboardList className="h-4 w-4" />;
  }
}

function getRecordTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LAB_RESULT: "Lab Result",
    IMAGING: "Imaging",
    PRESCRIPTION: "Prescription",
    REFERRAL: "Referral",
    VISIT_NOTE: "Visit Note",
    OTHER: "Other",
  };
  return labels[type] || type;
}

// =============================================================================
// Component
// =============================================================================

export default function RecordsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetPatientMedicalRecordsQuery({
    page,
    limit: 10,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Medical Records</h1>
        <p className="text-muted-foreground mt-1">
          Your consultation history and medical documentation
        </p>
      </motion.div>

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load medical records"
              description="Something went wrong while loading your records."
              action={
                <Button variant="outline" onClick={() => window.location.reload()}>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </div>
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
              description="Your medical records will be available here after consultations with your doctors."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {records.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                        {getRecordTypeIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground">{record.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {record.doctor
                                ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`
                                : "Unknown doctor"}
                              {record.doctor?.specialization &&
                                ` · ${record.doctor.specialization}`}
                            </p>
                          </div>
                          <Badge variant="default" size="sm">
                            {getRecordTypeLabel(record.type)}
                          </Badge>
                        </div>

                        {record.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {record.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(record.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {record.consultation && (
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5" />
                              Consultation: {record.consultation.diagnosis}
                            </span>
                          )}
                        </div>

                        {record.treatmentPlan && (
                          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Treatment Plan</p>
                            <p className="text-sm text-foreground">{record.treatmentPlan}</p>
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
