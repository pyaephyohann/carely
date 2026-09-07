import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = NonNullable<typeof prisma>;

const UPCOMING_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const;

export async function getDoctorProfileId(userId: string, db: Db = prisma!) {
  return db.doctor.findFirst({
    where: { userId },
    select: { id: true },
  });
}

/** True when the doctor has at least one appointment with the patient. */
export async function doctorHasPatientRelationship(
  doctorId: string,
  patientId: string,
  db: Db = prisma!,
): Promise<boolean> {
  const link = await db.appointment.findFirst({
    where: { doctorId, patientId },
    select: { id: true },
  });
  return Boolean(link);
}

export function buildPatientSearchFilter(
  search: string | undefined,
): Prisma.PatientWhereInput | undefined {
  const q = search?.trim();
  if (!q) return undefined;

  return {
    OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      {
        user: {
          email: { contains: q, mode: "insensitive" },
        },
      },
    ],
  };
}

export async function getLinkedPatientIds(doctorId: string, db: Db = prisma!) {
  const rows = await db.appointment.findMany({
    where: { doctorId },
    distinct: ["patientId"],
    select: { patientId: true },
  });
  return rows.map((row) => row.patientId);
}

export async function fetchPatientListAggregates(
  doctorId: string,
  patientIds: string[],
  now: Date,
  db: Db = prisma!,
) {
  if (patientIds.length === 0) {
    return {
      appointmentCounts: new Map<string, number>(),
      prescriptionCounts: new Map<string, number>(),
      lastAppointments: new Map<string, { id: string; startTime: Date; status: string }>(),
      nextAppointments: new Map<string, { id: string; startTime: Date; status: string }>(),
    };
  }

  const [appointmentGroups, prescriptionGroups, lastRows, nextRows] = await Promise.all([
    db.appointment.groupBy({
      by: ["patientId"],
      where: { doctorId, patientId: { in: patientIds } },
      _count: { id: true },
    }),
    db.prescription.groupBy({
      by: ["patientId"],
      where: {
        doctorId,
        patientId: { in: patientIds },
        status: { not: "DRAFT" },
      },
      _count: { id: true },
    }),
    db.appointment.findMany({
      where: {
        doctorId,
        patientId: { in: patientIds },
        OR: [{ startTime: { lt: now } }, { status: { in: ["COMPLETED", "NO_SHOW"] } }],
      },
      orderBy: { startTime: "desc" },
      distinct: ["patientId"],
      select: {
        id: true,
        patientId: true,
        startTime: true,
        status: true,
      },
    }),
    db.appointment.findMany({
      where: {
        doctorId,
        patientId: { in: patientIds },
        startTime: { gte: now },
        status: { in: [...UPCOMING_STATUSES] },
      },
      orderBy: { startTime: "asc" },
      distinct: ["patientId"],
      select: {
        id: true,
        patientId: true,
        startTime: true,
        status: true,
      },
    }),
  ]);

  return {
    appointmentCounts: new Map(appointmentGroups.map((g) => [g.patientId, g._count.id])),
    prescriptionCounts: new Map(prescriptionGroups.map((g) => [g.patientId, g._count.id])),
    lastAppointments: new Map(
      lastRows.map((row) => [
        row.patientId,
        { id: row.id, startTime: row.startTime, status: row.status },
      ]),
    ),
    nextAppointments: new Map(
      nextRows.map((row) => [
        row.patientId,
        { id: row.id, startTime: row.startTime, status: row.status },
      ]),
    ),
  };
}

/** Best appointment for prescription creation: upcoming CONFIRMED first, else latest clinical visit. */
export async function findPrescriptionAppointmentId(
  doctorId: string,
  patientId: string,
  db: Db = prisma!,
): Promise<string | null> {
  const now = new Date();

  const upcoming = await db.appointment.findFirst({
    where: {
      doctorId,
      patientId,
      status: "CONFIRMED",
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    select: { id: true },
  });
  if (upcoming) return upcoming.id;

  const confirmedPast = await db.appointment.findFirst({
    where: {
      doctorId,
      patientId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    orderBy: { startTime: "desc" },
    select: { id: true },
  });
  return confirmedPast?.id ?? null;
}
