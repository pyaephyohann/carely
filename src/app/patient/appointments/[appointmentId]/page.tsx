"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  AlertCircle,
  DollarSign,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetPatientAppointmentDetailQuery,
  useCancelPatientAppointmentMutation,
} from "@/store/api/appointmentApi";
import { getStatusLabel, getStatusVariant, getDurationMinutes, formatDuration } from "@/lib/appointment-utils";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, isLoading, error } = useGetPatientAppointmentDetailQuery(appointmentId);
  const [cancelAppointment, { isLoading: isCancelling }] = useCancelPatientAppointmentMutation();

  const appointment = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-40" /></CardContent></Card>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Appointment not found"
          description="This appointment doesn't exist or you don't have access."
          action={<Button onClick={() => router.push("/patient/appointments")}>Back to Appointments</Button>}
        />
      </div>
    );
  }

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const duration = getDurationMinutes(appointment.startTime, appointment.endTime);

  const handleCancel = async () => {
    try {
      await cancelAppointment({ appointmentId: appointment.id }).unwrap();
      router.push("/patient/appointments");
    } catch {
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patient/appointments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Appointment Details</h1>
              <Badge variant={getStatusVariant(appointment.status)} size="md">
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Doctor Info */}
            <div className="flex items-center gap-4">
              <Avatar firstName={appointment.doctor.firstName} lastName={appointment.doctor.lastName} src={appointment.doctor.avatar} size="lg" />
              <div>
                <p className="font-semibold text-foreground">
                  Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                </p>
                {appointment.doctor.specialization && (
                  <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                )}
              </div>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
                <p className="font-medium text-foreground">
                  {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Time
                </div>
                <p className="font-medium text-foreground">
                  {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} —{" "}
                  {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  {appointment.type === "VIRTUAL" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  Type
                </div>
                <p className="font-medium text-foreground">
                  {appointment.type === "VIRTUAL" ? "Virtual Consultation" : "In-Person Visit"}
                </p>
              </div>
              {appointment.doctor.consultationFee != null && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <DollarSign className="h-4 w-4" />
                    Fee
                  </div>
                  <p className="font-medium text-foreground">${appointment.doctor.consultationFee}</p>
                </div>
              )}
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason for Visit</h3>
                <p className="text-foreground">{appointment.reason}</p>
              </div>
            )}

            {/* Doctor Contact */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Doctor Contact</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                {appointment.doctor.phone && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {appointment.doctor.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Cancel info */}
            {appointment.cancelReason && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Cancelled</strong> by {appointment.cancelledBy || "unknown"}
                  {appointment.cancelReason && `: ${appointment.cancelReason}`}
                </p>
              </div>
            )}

            {/* Actions */}
            {["PENDING", "CONFIRMED"].includes(appointment.status) && (
              <div className="border-t border-border pt-4">
                {showCancelConfirm ? (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Are you sure you want to cancel this appointment?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" onClick={handleCancel} isLoading={isCancelling}>
                        Yes, Cancel Appointment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(false)}>
                        Keep Appointment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setShowCancelConfirm(true)}>
                    Cancel Appointment
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Booked on {new Date(appointment.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
