"use client";

import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/features/patient/empty-state";

export default function PharmacyProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pharmacy Profile</h1>
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={<Settings className="h-8 w-8" />}
            title="Pharmacy settings"
            description="Pharmacy profile management will be available in a future update. Contact your administrator to update pharmacy details."
          />
        </CardContent>
      </Card>
    </div>
  );
}
