"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

import { Skeleton } from "@/components/ui/skeleton";
import { useCreateConsultationMutation } from "@/store/api/consultationApi";
import { useSearchMedicinesQuery } from "@/store/api/medicineApi";
import { cn } from "@/utils/cn";
import type { CreateConsultationRequest } from "@/store/api/consultationApi";
import type { Medicine } from "@/store/api/medicineApi";

// =============================================================================
// Types
// =============================================================================

interface PrescriptionItemForm {
  medicineId: string;
  medicineName: string;
  medicineGenericName: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Props {
  appointmentId: string;
  patientName: string;
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function ConsultationForm({ appointmentId, patientName, onSuccess }: Props) {
  const router = useRouter();
  const [createConsultation, { isLoading: isCreating }] = useCreateConsultationMutation();

  // Consultation fields
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Prescription toggle
  const [addPrescription, setAddPrescription] = useState(false);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemForm[]>([]);

  // Medicine search
  const [medicineQuery, setMedicineQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const { data: medicineResults, isFetching: isSearchingMedicines } = useSearchMedicinesQuery(
    { q: medicineQuery, limit: 8 },
    { skip: !medicineQuery || medicineQuery.length < 2 },
  );

  // Errors
  const [formError, setFormError] = useState<string | null>(null);

  const medicines = medicineResults?.data || [];

  // ---- Add prescription item ----
  const handleAddMedicine = useCallback((medicine: Medicine) => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineId: medicine.id,
        medicineName: medicine.name,
        medicineGenericName: medicine.genericName,
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
    setMedicineQuery("");
    setShowMedicineSearch(false);
  }, []);



  const handleItemChange = useCallback(
    (index: number, field: keyof PrescriptionItemForm, value: string) => {
      setPrescriptionItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  // ---- Validation ----
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
        if (!item.medicineId) return `Medicine ${i + 1}: medicine is required.`;
        if (!item.dosage.trim()) return `Medicine ${i + 1}: dosage is required.`;
        if (!item.frequency.trim()) return `Medicine ${i + 1}: frequency is required.`;
        if (!item.duration.trim()) return `Medicine ${i + 1}: duration is required.`;
      }
    }

    return null;
  };

  // ---- Submit ----
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
    };

    if (addPrescription && prescriptionItems.length > 0) {
      payload.prescription = {
        diagnosis: prescriptionDiagnosis.trim(),
        notes: prescriptionNotes.trim() || undefined,
        validUntil: validUntil || undefined,
        items: prescriptionItems.map((item) => ({
          medicineId: item.medicineId,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions.trim() || undefined,
        })),
      };
    }

    try {
      const result = await createConsultation(payload).unwrap();
      if (result.data) {
        onSuccess?.();
        // Refresh the page to show updated state
        router.refresh();
      }
    } catch {
      setFormError("Failed to save consultation. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Consultation Notes</h2>
          <p className="text-sm text-muted-foreground">
            Record consultation details for {patientName}
          </p>
        </div>
      </div>

      {/* Error */}
      {formError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
        </motion.div>
      )}

      {/* Diagnosis */}
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
            <p className="text-xs text-muted-foreground mt-1">{symptoms.length}/2000</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Clinical Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Treatment plan, recommendations, follow-up instructions..."
              rows={4}
              maxLength={5000}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{notes.length}/5000</p>
          </div>
          <Input
            label="Follow-up Date"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            helperText="Optional: Schedule a follow-up appointment"
          />
        </CardContent>
      </Card>

      {/* Prescription Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-base font-semibold text-foreground">Prescription</h3>
            </div>
            <button
              onClick={() => setAddPrescription(!addPrescription)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
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
                    Notes
                  </label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="General prescription notes"
                    rows={2}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  />
                </div>

                <Input
                  label="Valid Until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  helperText="Optional: Prescription expiry date"
                />

                {/* Medicine Search */}
                <div className="relative">
                  <Input
                    label="Add Medicine"
                    value={medicineQuery}
                    onChange={(e) => {
                      setMedicineQuery(e.target.value);
                      setShowMedicineSearch(e.target.value.length >= 2);
                    }}
                    onFocus={() => {
                      if (medicineQuery.length >= 2) setShowMedicineSearch(true);
                    }}
                    placeholder="Search medicine by name..."
                  />
                  {showMedicineSearch && medicines.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {isSearchingMedicines ? (
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        medicines.map((med) => (
                          <button
                            key={med.id}
                            onClick={() => handleAddMedicine(med)}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">{med.name}</p>
                                {med.genericName && (
                                  <p className="text-xs text-muted-foreground">
                                    {med.genericName} &middot; {med.category}
                                  </p>
                                )}
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {showMedicineSearch &&
                    medicineQuery.length >= 2 &&
                    medicines.length === 0 &&
                    !isSearchingMedicines && (
                      <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-lg shadow-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground">No medicines found</p>
                      </div>
                    )}
                </div>

                {/* Prescription Items */}
                {prescriptionItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Prescription Items ({prescriptionItems.length})
                    </h4>
                    {prescriptionItems.map((item, idx) => (
                      <motion.div
                        key={item.medicineId}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {item.medicineName}
                            </p>
                            {item.medicineGenericName && (
                              <p className="text-xs text-muted-foreground">
                                {item.medicineGenericName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleItemChange(idx, "medicineId", "")}
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Dosage *"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(idx, "dosage", e.target.value)}
                            placeholder="e.g. 500mg"
                          />
                          <Input
                            label="Frequency *"
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, "frequency", e.target.value)}
                            placeholder="e.g. 3 times daily"
                          />
                          <Input
                            label="Duration *"
                            value={item.duration}
                            onChange={(e) => handleItemChange(idx, "duration", e.target.value)}
                            placeholder="e.g. 7 days"
                          />
                          <Input
                            label="Instructions"
                            value={item.instructions}
                            onChange={(e) => handleItemChange(idx, "instructions", e.target.value)}
                            placeholder="e.g. Take after meals"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isCreating}>
          Save Consultation
        </Button>
      </div>
    </div>
  );
}
