import type { Prisma } from "@prisma/client";
import {
  buildClinicalSummary,
  buildRecordTitle,
  matchesMedicalRecordFilter,
  type PatientMedicalRecordFilter,
} from "@/lib/patient-medical-record-utils";
import { mapPrescriptionItemResponse } from "@/lib/prescription-item-utils";

type DbClient = NonNullable<typeof import("@/lib/prisma").prisma>;

const doctorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  specialization: {
    select: { name: true },
  },
} satisfies Prisma.DoctorSelect;

const appointmentSelect = {
  id: true,
  startTime: true,
  endTime: true,
  status: true,
  type: true,
  reason: true,
} satisfies Prisma.AppointmentSelect;

function mapDoctor(
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    specialization: { name: string } | null;
  } | null,
) {
  if (!doctor) return null;
  return {
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    phone: doctor.phone,
    avatar: doctor.avatar,
    specialization: doctor.specialization?.name ?? null,
  };
}

export async function fetchPatientMedicalRecordSummaries(
  db: DbClient,
  patientId: string,
  options: {
    filter?: PatientMedicalRecordFilter;
    page?: number;
    limit?: number;
  } = {},
) {
  const filter = options.filter ?? "all";
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));

  const [consultations, standaloneRecords] = await Promise.all([
    db.consultation.findMany({
      where: { patientId },
      include: {
        appointment: { select: appointmentSelect },
        doctor: { select: doctorSelect },
        prescriptions: {
          where: { status: { not: "DRAFT" } },
          select: { id: true },
        },
        medicalRecords: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            treatmentPlan: true,
          },
          take: 1,
        },
      },
    }),
    db.medicalRecord.findMany({
      where: {
        patientId,
        consultationId: null,
      },
      include: {
        doctor: { select: doctorSelect },
      },
    }),
  ]);

  const merged = [
    ...consultations.map((consultation) => {
      const linkedRecord = consultation.medicalRecords[0] ?? null;
      const candidate = {
        id: consultation.id,
        source: "consultation" as const,
        visitDate: consultation.appointment?.startTime ?? consultation.createdAt,
        diagnosis: consultation.diagnosis,
        symptoms: consultation.symptoms,
        notes: consultation.notes,
        treatmentPlan: linkedRecord?.treatmentPlan ?? null,
        description: linkedRecord?.description ?? null,
        title: linkedRecord?.title ?? null,
        followUpDate: consultation.followUpDate,
        prescriptionCount: consultation.prescriptions.length,
        appointmentStatus: consultation.appointment?.status ?? null,
      };

      return {
        id: consultation.id,
        source: "consultation" as const,
        recordType: linkedRecord?.type ?? "VISIT_NOTE",
        visitDate: candidate.visitDate.toISOString(),
        title: buildRecordTitle(candidate),
        summary: buildClinicalSummary(candidate),
        appointmentStatus: candidate.appointmentStatus,
        appointmentType: consultation.appointment?.type ?? null,
        hasPrescription: candidate.prescriptionCount > 0,
        prescriptionCount: candidate.prescriptionCount,
        followUpDate: consultation.followUpDate?.toISOString() ?? null,
        doctor: mapDoctor(consultation.doctor),
        diagnosis: consultation.diagnosis,
        candidate,
      };
    }),
    ...standaloneRecords.map((record) => {
      const candidate = {
        id: record.id,
        source: "standalone" as const,
        visitDate: record.createdAt,
        diagnosis: null,
        symptoms: null,
        notes: null,
        treatmentPlan: record.treatmentPlan,
        description: record.description,
        title: record.title,
        followUpDate: null,
        prescriptionCount: 0,
        appointmentStatus: null,
      };

      return {
        id: record.id,
        source: "standalone" as const,
        recordType: record.type,
        visitDate: candidate.visitDate.toISOString(),
        title: record.title,
        summary: buildClinicalSummary(candidate),
        appointmentStatus: null,
        appointmentType: null,
        hasPrescription: false,
        prescriptionCount: 0,
        followUpDate: null,
        doctor: mapDoctor(record.doctor),
        diagnosis: null,
        candidate,
      };
    }),
  ]
    .filter((record) => matchesMedicalRecordFilter(record.candidate, filter))
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

  const total = merged.length;
  const start = (page - 1) * limit;
  const pageItems = merged.slice(start, start + limit).map(({ candidate, ...record }) => {
    void candidate;
    return record;
  });

  return {
    records: pageItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function fetchPatientMedicalRecordDetail(
  db: DbClient,
  patientId: string,
  recordId: string,
) {
  const consultation = await db.consultation.findFirst({
    where: {
      id: recordId,
      patientId,
    },
    include: {
      appointment: { select: appointmentSelect },
      doctor: { select: doctorSelect },
      medicalRecords: {
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          treatmentPlan: true,
          attachments: true,
          createdAt: true,
        },
      },
      prescriptions: {
        where: { status: { not: "DRAFT" } },
        include: {
          items: {
            include: { medicine: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (consultation) {
    const linkedRecord = consultation.medicalRecords[0] ?? null;
    return {
      id: consultation.id,
      source: "consultation" as const,
      visitDate: (consultation.appointment?.startTime ?? consultation.createdAt).toISOString(),
      doctor: mapDoctor(consultation.doctor),
      appointment: consultation.appointment
        ? {
            id: consultation.appointment.id,
            startTime: consultation.appointment.startTime.toISOString(),
            endTime: consultation.appointment.endTime.toISOString(),
            status: consultation.appointment.status,
            type: consultation.appointment.type,
            reason: consultation.appointment.reason,
          }
        : null,
      clinical: {
        diagnosis: consultation.diagnosis,
        symptoms: consultation.symptoms,
        notes: consultation.notes,
        treatmentPlan: linkedRecord?.treatmentPlan ?? null,
      },
      followUpDate: consultation.followUpDate?.toISOString() ?? null,
      medicalRecord: linkedRecord
        ? {
            id: linkedRecord.id,
            type: linkedRecord.type,
            title: linkedRecord.title,
            description: linkedRecord.description,
            treatmentPlan: linkedRecord.treatmentPlan,
            attachments: linkedRecord.attachments,
            createdAt: linkedRecord.createdAt.toISOString(),
          }
        : null,
      prescriptions: consultation.prescriptions.map((prescription) => ({
        id: prescription.id,
        diagnosis: prescription.diagnosis,
        notes: prescription.notes,
        status: prescription.status,
        validUntil: prescription.validUntil?.toISOString() ?? null,
        createdAt: prescription.createdAt.toISOString(),
        items: prescription.items.map((item) => mapPrescriptionItemResponse(item)),
      })),
    };
  }

  const standaloneRecord = await db.medicalRecord.findFirst({
    where: {
      id: recordId,
      patientId,
      consultationId: null,
    },
    include: {
      doctor: { select: doctorSelect },
    },
  });

  if (!standaloneRecord) {
    return null;
  }

  return {
    id: standaloneRecord.id,
    source: "standalone" as const,
    visitDate: standaloneRecord.createdAt.toISOString(),
    doctor: mapDoctor(standaloneRecord.doctor),
    appointment: null,
    clinical: {
      diagnosis: null,
      symptoms: null,
      notes: standaloneRecord.description,
      treatmentPlan: standaloneRecord.treatmentPlan,
    },
    followUpDate: null,
    medicalRecord: {
      id: standaloneRecord.id,
      type: standaloneRecord.type,
      title: standaloneRecord.title,
      description: standaloneRecord.description,
      treatmentPlan: standaloneRecord.treatmentPlan,
      attachments: standaloneRecord.attachments,
      createdAt: standaloneRecord.createdAt.toISOString(),
    },
    prescriptions: [],
  };
}
