"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Pill, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreatePrescriptionMutation } from "@/store/api/consultationApi";

interface PrescriptionItemForm {
  rowId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionFormProps {
  consultationId?: string;
  appointmentId?: string;
  defaultDiagnosis?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyItem(): PrescriptionItemForm {
  return {
    rowId: newRowId(),
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

export function PrescriptionForm({
  consultationId,
  appointmentId,
  defaultDiagnosis = "",
  onSuccess,
  onCancel,
}: PrescriptionFormProps) {
  const [createPrescription, { isLoading }] = useCreatePrescriptionMutation();

  const [diagnosis, setDiagnosis] = useState(defaultDiagnosis);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<PrescriptionItemForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()]);
  }, []);

  const handleRemoveItem = useCallback((rowId: string) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
  }, []);

  const handleItemChange = useCallback(
    (rowId: string, field: keyof PrescriptionItemForm, value: string) => {
      setItems((prev) =>
        prev.map((item) => (item.rowId === rowId ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const validate = (): string | null => {
    if (!diagnosis.trim()) return "Diagnosis is required.";
    if (items.length === 0) return "Add at least one medicine.";
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medicineName.trim()) return `Medicine ${i + 1}: name is required.`;
      if (!item.dosage.trim()) return `Medicine ${i + 1}: dosage is required.`;
      if (!item.frequency.trim()) return `Medicine ${i + 1}: frequency is required.`;
      if (!item.duration.trim()) return `Medicine ${i + 1}: duration is required.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!consultationId && !appointmentId) {
      setFormError("Missing appointment context. Please refresh and try again.");
      return;
    }
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }

    try {
      await createPrescription({
        ...(consultationId ? { consultationId } : { appointmentId: appointmentId! }),
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        validUntil: validUntil || undefined,
        items: items.map((item) => ({
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions.trim() || undefined,
        })),
      }).unwrap();
      onSuccess?.();
    } catch {
      setFormError("Failed to save prescription. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <h3 className="text-base font-semibold text-foreground">Create Prescription</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
          </div>
        )}

        <Input
          label="Diagnosis / Notes *"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Primary diagnosis for this prescription"
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Additional Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="General medication instructions for the patient"
            rows={2}
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
          />
        </div>

        <Input
          label="Valid Until"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          helperText="Optional expiry date"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground">
              Medicines{items.length > 0 ? ` (${items.length})` : ""}
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Medicine
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No medicines added yet. Click &quot;Add Medicine&quot; to start.
            </p>
          ) : (
            items.map((item, idx) => (
              <motion.div
                key={item.rowId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Medicine {idx + 1}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.rowId)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove medicine ${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
                <Input
                  label="Medicine *"
                  value={item.medicineName}
                  onChange={(e) => handleItemChange(item.rowId, "medicineName", e.target.value)}
                  placeholder="Enter medicine name"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Dosage *"
                    value={item.dosage}
                    onChange={(e) => handleItemChange(item.rowId, "dosage", e.target.value)}
                    placeholder="e.g. 500 mg"
                  />
                  <Input
                    label="Frequency *"
                    value={item.frequency}
                    onChange={(e) => handleItemChange(item.rowId, "frequency", e.target.value)}
                    placeholder="e.g. Twice daily"
                  />
                  <Input
                    label="Duration *"
                    value={item.duration}
                    onChange={(e) => handleItemChange(item.rowId, "duration", e.target.value)}
                    placeholder="e.g. 7 days"
                  />
                  <Input
                    label="Instructions"
                    value={item.instructions}
                    onChange={(e) =>
                      handleItemChange(item.rowId, "instructions", e.target.value)
                    }
                    placeholder="e.g. After meals"
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Save Prescription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
