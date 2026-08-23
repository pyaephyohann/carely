"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Pill,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetPharmacyFulfillmentDetailQuery,
  useUpdateFulfillmentStatusMutation,
} from "@/store/api/pharmacyApi";

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING", "REJECTED"],
  PREPARING: ["READY", "REJECTED"],
  READY: ["COMPLETED"],
};

export default function PharmacyFulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = params.fulfillmentId as string;
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const { data, isLoading, error } = useGetPharmacyFulfillmentDetailQuery(fulfillmentId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateFulfillmentStatusMutation();

  const fulfillment = data?.data;

  const handleStatusUpdate = async (status: string) => {
    if (status === "REJECTED") {
      if (!rejectReason.trim()) return;
      try {
        await updateStatus({ fulfillmentId, status: "REJECTED", rejectReason: rejectReason.trim() }).unwrap();
        setShowReject(false);
        setRejectReason("");
        router.refresh();
      } catch {
        // Error handled by RTK Query
      }
      return;
    }

    try {
      await updateStatus({ fulfillmentId, status }).unwrap();
      router.refresh();
    } catch {
      // Error handled by RTK Query
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !fulfillment) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Fulfillment not found"
          description="This fulfillment request doesn't exist or you don't have access."
          action={<Button onClick={() => router.push("/pharmacy/prescriptions")}>Back to Queue</Button>}
        />
      </div>
    );
  }

  const transitions = VALID_TRANSITIONS[fulfillment.status] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/pharmacy/prescriptions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Prescription Fulfillment</h1>
              <Badge variant={getStatusVariant(fulfillment.status)} size="md">{fulfillment.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-lg">
                {fulfillment.patient.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{fulfillment.patient.name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-0.5">
                  {fulfillment.patient.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{fulfillment.patient.phone}</span>
                  )}
                  {fulfillment.patient.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{fulfillment.patient.email}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Prescription Info */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Pill className="h-4 w-4" />Prescription
              </div>
              <p className="font-medium text-foreground">{fulfillment.prescription.diagnosis}</p>
              {fulfillment.prescription.notes && (
                <p className="text-sm text-muted-foreground mt-1">{fulfillment.prescription.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                By Dr. {fulfillment.prescription.doctor.firstName} {fulfillment.prescription.doctor.lastName}
                {" · "}{new Date(fulfillment.prescription.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Reject reason */}
            {fulfillment.rejectReason && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Rejection reason:</strong> {fulfillment.rejectReason}
                </p>
              </div>
            )}

            {/* Medicines */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3">Medications</h3>
              <div className="space-y-3">
                {fulfillment.prescription.items.map((item) => {
                  return (
                    <div key={item.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.medicineName}</p>
                          {item.medicineGenericName && (
                            <p className="text-xs text-muted-foreground">Generic: {item.medicineGenericName}</p>
                          )}
                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Dosage</p>
                              <p className="font-medium text-foreground">{item.dosage}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Frequency</p>
                              <p className="font-medium text-foreground">{item.frequency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-medium text-foreground">{item.duration}</p>
                            </div>
                          </div>
                          {item.instructions && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Instructions: {item.instructions}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {item.inStock ? (
                            <Badge variant="success" size="sm">In Stock ({item.stock})</Badge>
                          ) : (
                            <Badge variant="error" size="sm">Out of Stock</Badge>
                          )}
                          {item.price != null && (
                            <p className="text-sm font-medium text-foreground mt-1">${item.price.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            {transitions.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {transitions.includes("ACCEPTED") && (
                    <Button onClick={() => handleStatusUpdate("ACCEPTED")} isLoading={isUpdating}>
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                  )}
                  {transitions.includes("PREPARING") && (
                    <Button onClick={() => handleStatusUpdate("PREPARING")} isLoading={isUpdating}>
                      Start Preparing
                    </Button>
                  )}
                  {transitions.includes("READY") && (
                    <Button onClick={() => handleStatusUpdate("READY")} isLoading={isUpdating}>
                      Mark Ready
                    </Button>
                  )}
                  {transitions.includes("COMPLETED") && (
                    <Button onClick={() => handleStatusUpdate("COMPLETED")} isLoading={isUpdating}>
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </Button>
                  )}
                  {transitions.includes("REJECTED") && (
                    <>
                      {showReject ? (
                        <div className="w-full space-y-2">
                          <Input
                            label="Rejection Reason *"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Why is this prescription being rejected?"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatusUpdate("REJECTED")}
                              isLoading={isUpdating}
                              disabled={!rejectReason.trim()}
                            >
                              Confirm Rejection
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="danger" onClick={() => setShowReject(true)}>
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              Received {new Date(fulfillment.createdAt).toLocaleString("en-US", {
                month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
