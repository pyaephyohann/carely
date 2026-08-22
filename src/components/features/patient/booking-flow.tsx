"use client";

import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  DollarSign,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import {
  useGetDoctorAvailabilityQuery,
  useCreateAppointmentMutation,
} from "@/store/api/appointmentApi";
import type { AvailableSlot } from "@/store/api/appointmentApi";
import { useRouter } from "next/navigation";

// =============================================================================
// Types
// =============================================================================

interface BookingFlowProps {
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  consultationFee: number;
  onClose: () => void;
}

type Step = "date" | "time" | "type" | "confirm";

// =============================================================================
// Component
// =============================================================================

export function BookingFlow({
  doctorId,
  doctorName,
  specialization,
  consultationFee,
  onClose,
}: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [appointmentType, setAppointmentType] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [createAppointment, { isLoading: isBooking }] = useCreateAppointmentMutation();

  // Generate next 14 days for date selection
  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(new Date(), i);
      return {
        dateStr: format(date, "yyyy-MM-dd"),
        label: format(date, "EEE"),
        day: format(date, "d"),
        month: format(date, "MMM"),
        full: format(date, "EEEE, MMMM d"),
        isToday: i === 0,
      };
    });
  }, []);

  // Fetch availability for selected date
  const { data: availabilityData, isLoading: isLoadingSlots } =
    useGetDoctorAvailabilityQuery(
      { doctorId, date: selectedDate! },
      { skip: !selectedDate },
    );

  const slots = availabilityData?.data?.slots || [];

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedDate) return;
    setBookingError(null);

    try {
      await createAppointment({
        doctorId,
        date: selectedDate,
        startTime: selectedSlot.localStartTime,
        type: appointmentType,
      }).unwrap();

      // Success — navigate to appointments
      router.push("/patient/appointments");
    } catch (error: unknown) {
      const err = error as { data?: { error?: { message?: string } }; message?: string };
      setBookingError(
        err?.data?.error?.message || err?.message || "Failed to book appointment. Please try again.",
      );
    }
  };

  const stepIndex = ["date", "time", "type", "confirm"].indexOf(step);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-4">
        {["Date", "Time", "Type", "Confirm"].map((label, idx) => (
          <div key={label} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                idx <= stepIndex
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
              )}
            >
              {idx < stepIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:inline",
                idx <= stepIndex ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {idx < 3 && (
              <div
                className={cn(
                  "w-8 sm:w-16 h-0.5 mx-2",
                  idx < stepIndex ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-700",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {bookingError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {bookingError}
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === "date" && (
          <motion.div
            key="date"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-3">Select a date</h3>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => {
                    setSelectedDate(d.dateStr);
                    setSelectedSlot(null);
                    setStep("time");
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg text-sm transition-colors",
                    d.dateStr === selectedDate
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground",
                  )}
                >
                  <span className="text-[10px] uppercase text-muted-foreground dark:text-zinc-400">
                    {d.label}
                  </span>
                  <span className="font-semibold">{d.day}</span>
                  <span className="text-[10px]">{d.month}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "time" && (
          <motion.div
            key="time"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                Available times — {dates.find((d) => d.dateStr === selectedDate)?.full}
              </h3>
              <button
                onClick={() => setStep("date")}
                className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                Change date
              </button>
            </div>

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No available slots for this date.</p>
                <button
                  onClick={() => setStep("date")}
                  className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 mt-2"
                >
                  Try another date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.localStartTime}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("type");
                    }}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      selectedSlot?.localStartTime === slot.localStartTime
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-950 text-foreground",
                    )}
                  >
                    {formatTime12(slot.localStartTime)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-3">Appointment type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAppointmentType("IN_PERSON")}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-colors",
                  appointmentType === "IN_PERSON"
                    ? "border-violet-600 bg-violet-50 dark:bg-violet-950"
                    : "border-border hover:border-zinc-300 dark:hover:border-zinc-600",
                )}
              >
                <Stethoscope className={cn("h-5 w-5 mb-2", appointmentType === "IN_PERSON" ? "text-violet-600" : "text-muted-foreground")} />
                <p className="font-medium text-foreground">In Person</p>
                <p className="text-xs text-muted-foreground">Visit the clinic</p>
              </button>
              <button
                onClick={() => setAppointmentType("VIRTUAL")}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-colors",
                  appointmentType === "VIRTUAL"
                    ? "border-violet-600 bg-violet-50 dark:bg-violet-950"
                    : "border-border hover:border-zinc-300 dark:hover:border-zinc-600",
                )}
              >
                <Video className={cn("h-5 w-5 mb-2", appointmentType === "VIRTUAL" ? "text-violet-600" : "text-muted-foreground")} />
                <p className="font-medium text-foreground">Virtual</p>
                <p className="text-xs text-muted-foreground">Online consultation</p>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setStep("confirm")}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-4">Confirm your appointment</h3>
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dr. {doctorName}</p>
                    {specialization && <p className="text-sm text-muted-foreground">{specialization}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">
                      {dates.find((d) => d.dateStr === selectedDate)?.full}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground">
                      {selectedSlot && formatTime12(selectedSlot.localStartTime)} —{" "}
                      {selectedSlot && formatTime12(selectedSlot.localEndTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground">
                      {appointmentType === "IN_PERSON" ? "In Person" : "Virtual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fee</p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {consultationFee}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("type")}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleConfirmBooking} isLoading={isBooking}>
                <CheckCircle className="h-4 w-4" />
                Confirm Appointment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {step === "date" && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12;
  return `${hours}:${m.toString().padStart(2, "0")} ${period}`;
}
