"use client";

import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/features/patient/empty-state";

export default function RecordsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Medical Records</h1>
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No medical records"
            description="Your medical records will be available here after consultations with your doctors."
          />
        </CardContent>
      </Card>
    </div>
  );
}
