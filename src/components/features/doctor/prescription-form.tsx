"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Pill, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatePrescriptionMutation } from "@/store/api/consultationApi";
import { useSearchMedicinesQuery } from "@/store/api/medicineApi";
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

interface PrescriptionFormProps {
  consultationId: string;
  defaultDiagnosis?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function newRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PrescriptionForm({
  consultationId,
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

  const [medicineQuery, setMedicineQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const { data: medicineResults, isFetching: isSearchingMedicines } =
    useSearchMedicinesQuery(
      { q: medicineQuery, limit: 8 },
      { skip: !medicineQuery || medicineQuery.length < 2 },
    );

  const medicines = medicineResults?.data || [];

  const handleAddMedicine = useCallback((medicine: Medicine) => {
    setItems((prev) => [
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
      if (!item.dosage.trim()) return `Medicine ${i + 1}: dosage is required.`;
      if (!item.frequency.trim()) return `Medicine ${i + 1}: frequency is required.`;
      if (!item.duration.trim()) return `Medicine ${i + 1}: duration is required.`;
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

    try {
      await createPrescription({
        consultationId,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        validUntil: validUntil || undefined,
        items: items.map((item) => ({
          medicineId: item.medicineId,
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

        {/* Medicine search */}
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
                        <p className="text-sm font-medium text-foreground truncate">{med.name}</p>
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

        {/* Medicine items */}
        {items.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Medicines ({items.length})
            </h4>
            {items.map((item, idx) => (
              <motion.div
                key={item.rowId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-muted/50 border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.medicineName}</p>
                    {item.medicineGenericName && (
                      <p className="text-xs text-muted-foreground">{item.medicineGenericName}</p>
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
                    label={`Dosage *`}
                    value={item.dosage}
                    onChange={(e) => handleItemChange(item.rowId, "dosage", e.target.value)}
                    placeholder="e.g. 500mg"
                  />
                  <Input
                    label="Frequency *"
                    value={item.frequency}
                    onChange={(e) => handleItemChange(item.rowId, "frequency", e.target.value)}
                    placeholder="e.g. 2x daily"
                  />
                  <Input
                    label="Duration *"
                    value={item.duration}
                    onChange={(e) => handleItemChange(item.rowId, "duration", e.target.value)}
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
                <p className="text-xs text-muted-foreground sm:hidden">Medicine {idx + 1}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="cursor-pointer">
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} isLoading={isLoading} className="cursor-pointer">
            Save Prescription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
