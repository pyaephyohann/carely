/** Client-safe filter values for patient medical records */
export const PATIENT_MEDICAL_RECORD_FILTERS = [
  "all",
  "recent",
  "diagnoses",
  "consultations",
  "prescriptions",
] as const;

export type PatientMedicalRecordFilter = (typeof PATIENT_MEDICAL_RECORD_FILTERS)[number];

export function isPatientMedicalRecordFilter(value: string): value is PatientMedicalRecordFilter {
  return (PATIENT_MEDICAL_RECORD_FILTERS as readonly string[]).includes(value);
}

/** Records within the last 6 months are considered "recent". */
export const RECENT_RECORD_WINDOW_MS = 1000 * 60 * 60 * 24 * 30 * 6;

export interface MedicalRecordListCandidate {
  id: string;
  source: "consultation" | "standalone";
  visitDate: Date;
  diagnosis: string | null;
  symptoms: string | null;
  notes: string | null;
  treatmentPlan: string | null;
  description: string | null;
  title: string | null;
  followUpDate: Date | null;
  prescriptionCount: number;
  appointmentStatus: string | null;
}

export function buildClinicalSummary(record: MedicalRecordListCandidate): string | null {
  const parts = [record.symptoms, record.notes, record.treatmentPlan, record.description].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  if (parts.length === 0) return null;
  const combined = parts.join(" · ");
  return combined.length > 160 ? `${combined.slice(0, 157)}…` : combined;
}

export function buildRecordTitle(record: MedicalRecordListCandidate): string {
  if (record.diagnosis?.trim()) return record.diagnosis.trim();
  if (record.title?.trim()) return record.title.trim();
  return "Medical visit";
}

export function hasFullConsultationDetails(record: MedicalRecordListCandidate): boolean {
  return Boolean(record.symptoms?.trim() || record.notes?.trim() || record.followUpDate);
}

export function matchesMedicalRecordFilter(
  record: MedicalRecordListCandidate,
  filter: PatientMedicalRecordFilter,
  now = Date.now(),
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "recent":
      return now - record.visitDate.getTime() <= RECENT_RECORD_WINDOW_MS;
    case "diagnoses":
      return Boolean(record.diagnosis?.trim());
    case "consultations":
      return hasFullConsultationDetails(record);
    case "prescriptions":
      return record.prescriptionCount > 0;
    default:
      return true;
  }
}

export function getRecordTypeLabel(type: string): string {
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
