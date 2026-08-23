"use client";

import { useState } from "react";
import { Pill, Search, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchMedicinesQuery } from "@/store/api/medicineApi";

export default function AdminMedicinesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useSearchMedicinesQuery({
    q: search || undefined,
    limit: 50,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Medicine Catalog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Browse and manage the global medicine catalog.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Failed to load medicines.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Medicines Grid */}
      {!isLoading && !error && data?.data && (
        <>
          {data.data.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
              <Pill className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm">No medicines found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.map((medicine) => (
                <Card key={medicine.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{medicine.name}</h3>
                      {medicine.requiresPrescription && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                          Rx
                        </span>
                      )}
                    </div>
                    {medicine.genericName && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Generic: {medicine.genericName}</p>
                    )}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Category: {medicine.category}</p>
                    {medicine.dosageForms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {medicine.dosageForms.map((form) => (
                          <span
                            key={form}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {form}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
