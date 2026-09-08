/** Resolve the display name for a prescription item (stored name takes precedence). */
export function displayMedicineName(item: {
  medicineName: string;
  medicine?: { name: string } | null;
}): string {
  const name = item.medicineName?.trim() || item.medicine?.name?.trim();
  return name || "Unknown medicine";
}

export function mapPrescriptionItemResponse(item: {
  id: string;
  medicineId: string | null;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  medicine?: {
    name: string;
    genericName: string | null;
    category?: string;
    description?: string | null;
    dosageForms?: string[];
  } | null;
}) {
  return {
    id: item.id,
    medicineId: item.medicineId,
    medicineName: displayMedicineName(item),
    medicineGenericName: item.medicine?.genericName ?? null,
    medicineCategory: item.medicine?.category,
    medicineDescription: item.medicine?.description ?? undefined,
    dosageForms: item.medicine?.dosageForms,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    instructions: item.instructions,
  };
}

export function buildPrescriptionItemCreateData(item: {
  medicineName: string;
  medicineId?: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}) {
  return {
    medicineName: item.medicineName.trim(),
    medicineId: item.medicineId || null,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    instructions: item.instructions || null,
  };
}
