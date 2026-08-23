"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Pill,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import {
  useGetPharmacyByIdQuery,
  useGetPharmacyInventoryQuery,
} from "@/store/api/pharmacyApi";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function PatientPharmacyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pharmacyId = params.pharmacyId as string;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: pharmacyData, isLoading: isLoadingPharmacy, error: pharmacyError } =
    useGetPharmacyByIdQuery(pharmacyId);

  const { data: inventoryData, isLoading: isLoadingInventory } = useGetPharmacyInventoryQuery({
    pharmacyId,
    search,
    page,
    limit: 20,
  });

  const pharmacy = pharmacyData?.data;
  const inventory = inventoryData?.data || [];
  const meta = inventoryData?.meta;

  if (isLoadingPharmacy) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pharmacyError || !pharmacy) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Pharmacy not found"
          description="This pharmacy doesn't exist or is no longer available."
          action={<Button onClick={() => router.push("/patient/pharmacies")}>Back to Pharmacies</Button>}
        />
      </div>
    );
  }

  const openingHours = pharmacy.openingHours as Record<string, { open: string; close: string } | null> | null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patient/pharmacies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Pharmacies
        </Link>
      </motion.div>

      {/* Pharmacy Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">{pharmacy.name}</h1>
              {pharmacy.verified && (
                <Badge variant="success" size="md">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pharmacy.description && (
              <p className="text-muted-foreground">{pharmacy.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{pharmacy.address}</span>
              </div>
              {pharmacy.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{pharmacy.phone}</span>
                </div>
              )}
              {pharmacy.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{pharmacy.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{pharmacy.medicineCount} medicines available</span>
              </div>
            </div>

            {/* Opening Hours */}
            {openingHours && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Opening Hours
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {DAY_NAMES.map((day) => {
                    const hours = openingHours[day];
                    return (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize text-muted-foreground">{day}</span>
                        <span className="font-medium text-foreground">
                          {hours ? `${hours.open} – ${hours.close}` : "Closed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Medicine Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search medicines..."
          className="w-full pl-4 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
        />
      </div>

      {/* Inventory */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <h2 className="text-lg font-semibold text-foreground mb-3">Available Medicines</h2>
        {isLoadingInventory ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : inventory.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Pill className="h-8 w-8" />}
                title={search ? "No matching medicines" : "No medicines available"}
                description={search ? "Try a different search term." : "This pharmacy hasn't added any medicines yet."}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {inventory.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{item.medicine.name}</p>
                          {item.medicine.genericName && (
                            <p className="text-xs text-muted-foreground">{item.medicine.genericName} · {item.medicine.category}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge
                            variant={
                              item.availability === "available"
                                ? "success"
                                : item.availability === "limited"
                                  ? "warning"
                                  : "error"
                            }
                            size="sm"
                          >
                            {item.availability === "available"
                              ? "Available"
                              : item.availability === "limited"
                                ? "Limited"
                                : "Unavailable"}
                          </Badge>
                          <p className="text-sm font-semibold text-foreground mt-1">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
