import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/auth-helpers";
import { requireDatabase, apiError, apiSuccess } from "@/lib/api";
import { computePatientAge, formatGender } from "@/lib/doctor-patient-utils";
import {
  doctorHasPatientRelationship,
  findPrescriptionAppointmentId,
  getDoctorProfileId,
} from "@/lib/doctor-patient-service";

// =============================================================================
// GET /api/doctor/patients/[patientId]
// Patient overview for the authenticated doctor (appointment-linked access only)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const auth = await requireDoctor(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { patientId } = await params;

    const doctor = await getDoctorProfileId(auth.user.userId);
    if (!doctor) {
      return apiError("Doctor profile not found", "NOT_FOUND", 404);
    }

    const hasRelationship = await doctorHasPatientRelationship(doctor.id, patientId);
    if (!hasRelationship) {
      return apiError("Patient not found", "NOT_FOUND", 404);
    }

    const now = new Date();

    const [patient, appointments, prescriptions, consultations, medicalRecords, prescriptionAppointmentId] =
      await Promise.all([
        prisma!.patient.findUnique({
          where: { id: patientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            avatar: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        }),
        prisma!.appointment.findMany({
          where: { doctorId: doctor.id, patientId },
          orderBy: { startTime: "desc" },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            type: true,
            reason: true,
            notes: true,
            createdAt: true,
            consultation: {
              select: {
                id: true,
                followUpDate: true,
              },
            },
          },
        }),
        prisma!.prescription.findMany({
          where: {
            doctorId: doctor.id,
            patientId,
            status: { not: "DRAFT" },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            diagnosis: true,
            notes: true,
            status: true,
            validUntil: true,
            createdAt: true,
            consultationId: true,
            items: {
              select: { id: true },
            },
          },
        }),
        prisma!.consultation.findMany({
          where: { doctorId: doctor.id, patientId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            appointmentId: true,
            diagnosis: true,
            symptoms: true,
            notes: true,
            followUpDate: true,
            createdAt: true,
          },
        }),
        prisma!.medicalRecord.findMany({
          where: { doctorId: doctor.id, patientId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            treatmentPlan: true,
            createdAt: true,
            consultationId: true,
          },
        }),
        findPrescriptionAppointmentId(doctor.id, patientId),
      ]);

    if (!patient) {
      return apiError("Patient not found", "NOT_FOUND", 404);
    }

    const upcomingAppointments = appointments.filter(
      (appt) =>
        appt.startTime >= now &&
        ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(appt.status),
    );
    const pastAppointments = appointments.filter(
      (appt) =>
        appt.startTime < now ||
        ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(appt.status),
    );

    return apiSuccess({
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        email: patient.user.email,
        avatar: patient.avatar,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth?.toISOString() || null,
        age: computePatientAge(patient.dateOfBirth),
        gender: patient.gender,
        genderLabel: formatGender(patient.gender),
        memberSince: patient.createdAt.toISOString(),
      },
      stats: {
        appointmentCount: appointments.length,
        prescriptionCount: prescriptions.length,
        consultationCount: consultations.length,
      },
      prescriptionAppointmentId,
      appointments: {
        upcoming: upcomingAppointments.map(mapAppointment),
        past: pastAppointments.map(mapAppointment),
        all: appointments.map(mapAppointment),
      },
      prescriptions: prescriptions.map((rx) => ({
        id: rx.id,
        consultationId: rx.consultationId,
        diagnosis: rx.diagnosis,
        notes: rx.notes,
        status: rx.status,
        validUntil: rx.validUntil?.toISOString() || null,
        createdAt: rx.createdAt.toISOString(),
        itemCount: rx.items.length,
      })),
      consultations: consultations.map((c) => ({
        id: c.id,
        appointmentId: c.appointmentId,
        diagnosis: c.diagnosis,
        symptoms: c.symptoms,
        notes: c.notes,
        followUpDate: c.followUpDate?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
      medicalRecords: medicalRecords.map((record) => ({
        id: record.id,
        type: record.type,
        title: record.title,
        description: record.description,
        treatmentPlan: record.treatmentPlan,
        consultationId: record.consultationId,
        createdAt: record.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logError("Error fetching doctor patient detail:", error);
    return apiError("Failed to fetch patient details", "INTERNAL_ERROR", 500);
  }
}

function mapAppointment(appt: {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  type: string;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
  consultation: { id: string; followUpDate: Date | null } | null;
}) {
  return {
    id: appt.id,
    startTime: appt.startTime.toISOString(),
    endTime: appt.endTime.toISOString(),
    status: appt.status,
    type: appt.type,
    reason: appt.reason,
    notes: appt.notes,
    createdAt: appt.createdAt.toISOString(),
    followUpDate: appt.consultation?.followUpDate?.toISOString() || null,
    consultationId: appt.consultation?.id || null,
  };
}
