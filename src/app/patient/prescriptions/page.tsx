"use client";

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/features/patient/empty-state";

export default function PrescriptionsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Prescriptions</h1>
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No prescriptions"
            description="Your prescriptions will appear here after your doctor creates them following a consultation."
          />
        </CardContent>
      </Card>
    </div>
  );
}
