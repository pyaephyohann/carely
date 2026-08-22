"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetDoctorsQuery, useGetSpecializationsQuery } from "@/store/api/doctorApi";
import { DoctorCard } from "@/components/features/patient/doctor-card";
import { DoctorGridSkeleton } from "@/components/features/patient/doctor-card-skeleton";
import { Pagination } from "@/components/features/patient/pagination";
import { EmptyState } from "@/components/features/patient/empty-state";
import { cn } from "@/utils/cn";

export default function DoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const urlSearch = searchParams.get("search") || "";
  const urlSpecialization = searchParams.get("specialization") || "";
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const sortBy = searchParams.get("sortBy") || "rating";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Local search state with debounce
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(localSearch, 400);

  // Sync debounced search to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to page 1 on search change
    const newUrl = `/patient/doctors${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, router, searchParams]);

  // RTK Query
  const { data, isLoading, error } = useGetDoctorsQuery({
    search: debouncedSearch || undefined,
    specialization: urlSpecialization || undefined,
    page: urlPage,
    limit: 12,
    sortBy,
    sortOrder,
  });

  const { data: specializationsData } = useGetSpecializationsQuery();

  const doctors = data?.data || [];
  const meta = data?.meta;
  const specializations = specializationsData?.data || [];

  // Update URL params helper
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") params.delete("page"); // Reset page on filter change
      const newUrl = `/patient/doctors${params.toString() ? `?${params.toString()}` : ""}`;
      router.push(newUrl, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateParam("page", page > 1 ? page.toString() : null);
    },
    [updateParam],
  );

  const clearFilters = useCallback(() => {
    router.push("/patient/doctors", { scroll: false });
    setLocalSearch("");
  }, [router]);

  const hasActiveFilters = urlSearch || urlSpecialization;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Find a Doctor</h1>
        <p className="text-muted-foreground mt-1">
          Search for trusted healthcare professionals
        </p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by doctor name or specialty..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
              aria-label="Search doctors"
            />
          </div>
        </div>

        {/* Specialization Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Specialty:</span>
          <button
            onClick={() => updateParam("specialization", null)}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              !urlSpecialization
                ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-medium"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
            )}
          >
            All
          </button>
          {specializations.map((spec) => (
            <button
              key={spec.id}
              onClick={() =>
                updateParam(
                  "specialization",
                  urlSpecialization === spec.slug ? null : spec.slug,
                )
              }
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                urlSpecialization === spec.slug
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-medium"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
              )}
            >
              {spec.name}
            </button>
          ))}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {urlSearch && (
              <Badge variant="primary">
                &quot;{urlSearch}&quot;
                <button
                  onClick={() => {
                    setLocalSearch("");
                    updateParam("search", null);
                  }}
                  className="ml-1 hover:text-violet-900 dark:hover:text-violet-100"
                  aria-label={`Remove search filter: ${urlSearch}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {urlSpecialization && (
              <Badge variant="primary">
                {specializations.find((s) => s.slug === urlSpecialization)?.name || urlSpecialization}
                <button
                  onClick={() => updateParam("specialization", null)}
                  className="ml-1 hover:text-violet-900 dark:hover:text-violet-100"
                  aria-label="Remove specialization filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* Results Count */}
      {!isLoading && meta && (
        <p className="text-sm text-muted-foreground">
          {meta.total === 0
            ? "No doctors found"
            : `Showing ${((meta.page - 1) * meta.limit) + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total} doctors`}
        </p>
      )}

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              title="Something went wrong"
              description="We couldn't load the doctor listing. Please try again."
              action={
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <DoctorGridSkeleton count={6} />
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No doctors found"
              description={
                hasActiveFilters
                  ? "Try changing your search or specialization filter."
                  : "No doctors are available at the moment. Check back later."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor, idx) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <DoctorCard doctor={doctor} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

