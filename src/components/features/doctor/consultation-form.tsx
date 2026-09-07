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
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateConsultationMutation } from "@/store/api/consultationApi";
import { useSearchMedicinesQuery } from "@/store/api/medicineApi";
import { cn } from "@/utils/cn";
import type { CreateConsultationRequest } from "@/store/api/consultationApi";
import type { Medicine } from "@/store/api/medicineApi";

interface PrescriptionItemForm {
  rowId: string;
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
  onCancel?: () => void;
}

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ConsultationForm({ appointmentId, patientName, onSuccess, onCancel }: Props) {
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

  const [medicineQuery, setMedicineQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const { data: medicineResults, isFetching: isSearchingMedicines } =
    useSearchMedicinesQuery(
      { q: medicineQuery, limit: 8 },
      { skip: !medicineQuery || medicineQuery.length < 2 },
    );

  const [formError, setFormError] = useState<string | null>(null);
  const medicines = medicineResults?.data || [];

  const handleTogglePrescription = () => {
    setAddPrescription((prev) => {
      const next = !prev;
      if (next && diagnosis.trim() && !prescriptionDiagnosis.trim()) {
        setPrescriptionDiagnosis(diagnosis.trim());
      }
      return next;
    });
  };

  const handleAddMedicine = useCallback((medicine: Medicine) => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        rowId: newRowId(),
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
      await createConsultation(payload).unwrap();
      onSuccess?.();
    } catch {
      setFormError("Failed to save consultation. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Consultation & Prescription</h2>
        <p className="text-sm text-muted-foreground">
          Record visit details for {patientName}. Completing this marks the appointment as done.
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
                  {showMedicineSearch && (
                    <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {isSearchingMedicines ? (
                        <div className="p-3 space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : medicines.length > 0 ? (
                        medicines.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handleAddMedicine(med)}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {med.name}
                                </p>
                                {med.genericName && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {med.genericName} · {med.category}
                                  </p>
                                )}
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          </button>
                        ))
                      ) : medicineQuery.length >= 2 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No medicines found
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {prescriptionItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Medicines ({prescriptionItems.length})
                    </h4>
                    {prescriptionItems.map((item) => (
                      <div
                        key={item.rowId}
                        className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm">{item.medicineName}</p>
                            {item.medicineGenericName && (
                              <p className="text-xs text-muted-foreground">
                                {item.medicineGenericName}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.rowId)}
                            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                            aria-label={`Remove ${item.medicineName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Dosage *"
                            value={item.dosage}
                            onChange={(e) => handleItemChange(item.rowId, "dosage", e.target.value)}
                            placeholder="e.g. 500mg"
                          />
                          <Input
                            label="Frequency *"
                            value={item.frequency}
                            onChange={(e) =>
                              handleItemChange(item.rowId, "frequency", e.target.value)
                            }
                            placeholder="e.g. 2x daily"
                          />
                          <Input
                            label="Duration *"
                            value={item.duration}
                            onChange={(e) =>
                              handleItemChange(item.rowId, "duration", e.target.value)
                            }
                            placeholder="e.g. 5 days"
                          />
                          <Input
                            label="Instructions"
                            value={item.instructions}
                            onChange={(e) =>
                              handleItemChange(item.rowId, "instructions", e.target.value)
                            }
                            placeholder="e.g. Take after meals"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
          {addPrescription ? "Complete Visit & Save Prescription" : "Complete Visit"}
        </Button>
      </div>
    </div>
  );
}
