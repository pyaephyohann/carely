/** Shared prescription status display helpers */

export function getPrescriptionStatusVariant(
  status: string,
): "default" | "primary" | "success" | "warning" | "error" | "info" {
  const variants: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
    DRAFT: "warning",
    ACTIVE: "info",
    FINALIZED: "primary",
    COMPLETED: "success",
    CANCELLED: "error",
  };
  return variants[status] || "default";
}

export function getPrescriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    FINALIZED: "Active",
    COMPLETED: "Past",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
}

/** Active = currently usable; Past = completed or cancelled */
export function isActivePrescription(status: string): boolean {
  return status === "ACTIVE" || status === "FINALIZED";
}
