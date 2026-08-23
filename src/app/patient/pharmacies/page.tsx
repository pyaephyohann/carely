"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  AlertCircle,
  MapPin,
  Phone,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import { useGetPharmaciesQuery } from "@/store/api/pharmacyApi";

export default function PatientPharmaciesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, error } = useGetPharmaciesQuery({
    search: debouncedSearch,
    page,
    limit: 12,
  });

  const pharmacies = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Find a Pharmacy</h1>
        <p className="text-muted-foreground mt-1">Locate pharmacies and check medicine availability</p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search pharmacies by name or address..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
        />
      </div>

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Couldn't load pharmacies"
              description="Something went wrong."
              action={<Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>}
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pharmacies.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="No pharmacies found"
              description="Try changing your search criteria."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacies.map((ph, idx) => (
              <motion.div
                key={ph.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Link href={`/patient/pharmacies/${ph.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {ph.name}
                        </h3>
                        {ph.verified && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {ph.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ph.description}</p>
                      )}
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{ph.address}</span>
                        </p>
                        {ph.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            {ph.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {ph.medicineCount} medicines available
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
