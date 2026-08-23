"use client";

import { useState } from "react";
import {
  Truck,
  Clock,
  AlertCircle,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetPatientFulfillmentsQuery } from "@/store/api/pharmacyApi";
import { cn } from "@/utils/cn";

function getStatusVariant(status: string) {
  const map: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
    PENDING: "warning",
    ACCEPTED: "info",
    PREPARING: "primary",
    READY: "success",
    COMPLETED: "success",
    REJECTED: "error",
    CANCELLED: "error",
  };
  return map[status] || "default";
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    PREPARING: "Preparing",
    READY: "Ready for Pickup",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  return map[status] || status;
}

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export default function PatientPharmacyOrdersPage() {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetPatientFulfillmentsQuery({
    status: filter || undefined,
    page,
    limit: 15,
  });

  const fulfillments = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pharmacy Orders</h1>
        <p className="text-muted-foreground mt-1">Track your prescription fulfillment requests</p>
      </motion.div>

      {/* Filters */}
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
              title="Couldn't load orders"
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
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : fulfillments.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Truck className="h-8 w-8" />}
              title="No pharmacy orders yet"
              description="Submit a prescription for fulfillment from your prescription details page."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {fulfillments.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{f.prescription?.diagnosis || "Prescription"}</h3>
                          <Badge variant={getStatusVariant(f.status)} size="sm">
                            {getStatusLabel(f.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Building2 className="inline h-3.5 w-3.5 mr-1" />
                          {f.pharmacy?.name || "Unknown Pharmacy"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(f.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span>{f.itemCount} medicines</span>
                          {f.fulfilledCount > 0 && (
                            <span>{f.fulfilledCount}/{f.itemCount} fulfilled</span>
                          )}
                        </div>
                        {f.rejectReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Rejection: {f.rejectReason}
                          </p>
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
