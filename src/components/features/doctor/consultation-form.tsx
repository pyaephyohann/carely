"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pill,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateConsultationMutation } from "@/store/api/consultationApi";
import { cn } from "@/utils/cn";
import type { CreateConsultationRequest } from "@/store/api/consultationApi";

interface PrescriptionItemForm {
  rowId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Props {
  appointmentId: string;
  patientName: string;
  /** When true, marks appointment COMPLETED after saving visit notes */
  completeAppointment?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyPrescriptionItem(): PrescriptionItemForm {
  return {
    rowId: newRowId(),
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

export function ConsultationForm({
  appointmentId,
  patientName,
  completeAppointment = false,
  onSuccess,
  onCancel,
}: Props) {
  const [createConsultation, { isLoading: isCreating }] = useCreateConsultationMutation();

  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemForm[]>([]);

  const [formError, setFormError] = useState<string | null>(null);

  const handleTogglePrescription = () => {
    setAddPrescription((prev) => {
      const next = !prev;
      if (next && diagnosis.trim() && !prescriptionDiagnosis.trim()) {
        setPrescriptionDiagnosis(diagnosis.trim());
      }
      if (next && prescriptionItems.length === 0) {
        setPrescriptionItems([emptyPrescriptionItem()]);
      }
      return next;
    });
  };

  const handleAddMedicine = useCallback(() => {
    setPrescriptionItems((prev) => [...prev, emptyPrescriptionItem()]);
  }, []);

  const handleRemoveItem = useCallback((rowId: string) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.rowId !== rowId));
  }, []);

  const handleItemChange = useCallback(
    (rowId: string, field: keyof PrescriptionItemForm, value: string) => {
      setPrescriptionItems((prev) =>
        prev.map((item) => (item.rowId === rowId ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const validate = (): string | null => {
    if (!diagnosis.trim()) return "Diagnosis is required.";
    if (diagnosis.length > 2000) return "Diagnosis must be 2000 characters or less.";
    if (symptoms && symptoms.length > 2000) return "Symptoms must be 2000 characters or less.";
    if (notes && notes.length > 5000) return "Notes must be 5000 characters or less.";

    if (addPrescription) {
      if (!prescriptionDiagnosis.trim()) return "Prescription diagnosis is required.";
      if (prescriptionItems.length === 0) return "Add at least one medicine to the prescription.";
      for (let i = 0; i < prescriptionItems.length; i++) {
        const item = prescriptionItems[i];
        if (!item.medicineName.trim()) return `Medicine ${i + 1}: name is required.`;
        if (!item.dosage.trim()) return `Medicine ${i + 1}: dosage is required.`;
        if (!item.frequency.trim()) return `Medicine ${i + 1}: frequency is required.`;
        if (!item.duration.trim()) return `Medicine ${i + 1}: duration is required.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setFormError(null);
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }

    const payload: CreateConsultationRequest = {
      appointmentId,
      diagnosis: diagnosis.trim(),
      symptoms: symptoms.trim() || undefined,
      notes: notes.trim() || undefined,
      followUpDate: followUpDate || undefined,
      completeAppointment,
    };

    if (addPrescription && prescriptionItems.length > 0) {
      payload.prescription = {
        diagnosis: prescriptionDiagnosis.trim(),
        notes: prescriptionNotes.trim() || undefined,
        validUntil: validUntil || undefined,
        items: prescriptionItems.map((item) => ({
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions.trim() || undefined,
        })),
      };
    }

    try {
      await createConsultation(payload).unwrap();
      onSuccess?.();
    } catch {
      setFormError("Failed to save consultation. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Visit Notes</h2>
        <p className="text-sm text-muted-foreground">
          Record consultation details for {patientName}. Saving notes does not require a
          prescription and does not complete the appointment unless you choose to.
        </p>
      </div>

      {formError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <Input
            label="Diagnosis *"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Primary diagnosis"
            maxLength={2000}
          />
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Symptoms
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Patient-reported symptoms"
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Treatment plan, recommendations..."
              rows={4}
              maxLength={5000}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
            />
          </div>
          <Input
            label="Follow-up Date"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            helperText="Optional"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-base font-semibold text-foreground">Prescription</h3>
            </div>
            <button
              type="button"
              onClick={handleTogglePrescription}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                addPrescription
                  ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {addPrescription ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Adding Prescription
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Prescription
                </>
              )}
            </button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {addPrescription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-4 pt-0">
                <Input
                  label="Prescription Diagnosis *"
                  value={prescriptionDiagnosis}
                  onChange={(e) => setPrescriptionDiagnosis(e.target.value)}
                  placeholder="Diagnosis for this prescription"
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Additional Instructions
                  </label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="General medication instructions"
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  />
                </div>
                <Input
                  label="Valid Until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  helperText="Optional"
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Medicines
                      {prescriptionItems.length > 0 ? ` (${prescriptionItems.length})` : ""}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMedicine}
                      disabled={isCreating}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Medicine
                    </Button>
                  </div>

                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={item.rowId}
                      className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Medicine {idx + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.rowId)}
                          disabled={isCreating}
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
                        onChange={(e) =>
                          handleItemChange(item.rowId, "medicineName", e.target.value)
                        }
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
                          onChange={(e) =>
                            handleItemChange(item.rowId, "frequency", e.target.value)
                          }
                          placeholder="e.g. Twice daily"
                        />
                        <Input
                          label="Duration *"
                          value={item.duration}
                          onChange={(e) =>
                            handleItemChange(item.rowId, "duration", e.target.value)
                          }
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isCreating} className="cursor-pointer">
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} isLoading={isCreating} className="cursor-pointer">
          {addPrescription ? "Save Visit Notes & Prescription" : "Save Visit Notes"}
        </Button>
      </div>
    </div>
  );
}
