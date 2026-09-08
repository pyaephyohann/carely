"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function doctorAppointmentDetailPath(appointmentId: string): string {
  return `/doctor/appointments/${appointmentId}`;
}

export function useDoctorAppointmentNavigation() {
  const router = useRouter();

  const goToAppointmentDetail = useCallback(
    (appointmentId: string | null | undefined) => {
      if (!appointmentId) return;
      router.push(doctorAppointmentDetailPath(appointmentId));
    },
    [router],
  );

  return { goToAppointmentDetail, doctorAppointmentDetailPath };
}
