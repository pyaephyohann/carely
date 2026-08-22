"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/features/patient/empty-state";

export default function AppointmentsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Appointments</h1>
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="No appointments yet"
            description="Appointment booking is coming soon. Find a doctor to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
