"use client";

import { useState, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { Pagination } from "@/components/features/patient/pagination";
import {
  useGetMyInventoryQuery,
  useAddInventoryItemMutation,
  useAdjustStockMutation,
  useRemoveInventoryItemMutation,
} from "@/store/api/pharmacyApi";
import { useSearchMedicinesQuery } from "@/store/api/medicineApi";


// =============================================================================
// Component
// =============================================================================

export default function PharmacyInventoryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Debounce search
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, error } = useGetMyInventoryQuery({
    search: debouncedSearch,
    page,
    limit: 20,
  });

  const [addInventoryItem, { isLoading: isAdding }] = useAddInventoryItemMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();
  const [removeItem, { isLoading: isRemoving }] = useRemoveInventoryItemMutation();

  // Add form state
  const [addQuery, setAddQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const { data: medicineResults } = useSearchMedicinesQuery(
    { q: addQuery, limit: 8 },
    { skip: !addQuery || addQuery.length < 2 },
  );
  const [selectedMedicine, setSelectedMedicine] = useState<{ id: string; name: string; genericName: string | null } | null>(null);
  const [addStock, setAddStock] = useState(0);
  const [addPrice, setAddPrice] = useState(0);
  const [addMinStock, setAddMinStock] = useState(0);

  // Adjust form state
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState<"PURCHASE" | "ADJUSTMENT" | "RETURN">("PURCHASE");

  const items = data?.data || [];
  const meta = data?.meta;

  const handleAdd = async () => {
    if (!selectedMedicine || addStock < 0 || addPrice < 0) return;
    try {
      await addInventoryItem({
        medicineId: selectedMedicine.id,
        stock: addStock,
        price: addPrice,
        minimumStock: addMinStock,
      }).unwrap();
      setShowAddForm(false);
      setSelectedMedicine(null);
      setAddQuery("");
      setAddStock(0);
      setAddPrice(0);
      setAddMinStock(0);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleAdjust = async (inventoryId: string) => {
    try {
      await adjustStock({
        inventoryId,
        quantity: adjustQty,
        type: adjustType,
      }).unwrap();
      setAdjustingId(null);
      setAdjustQty(0);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleRemove = async (inventoryId: string) => {
    try {
      await removeItem(inventoryId).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your pharmacy&apos;s medicine stock</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4" />
            Add Medicine
          </Button>
        </div>
      </motion.div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-foreground">Add Medicine to Inventory</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Medicine"
                    value={addQuery}
                    onChange={(e) => {
                      setAddQuery(e.target.value);
                      setShowMedicineSearch(e.target.value.length >= 2);
                      setSelectedMedicine(null);
                    }}
                    placeholder="Type medicine name..."
                  />
                  {showMedicineSearch && medicineResults?.data && medicineResults.data.length > 0 && !selectedMedicine && (
                    <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {medicineResults.data.map((med: { id: string; name: string; genericName: string | null; category: string }) => (
                        <button
                          key={med.id}
                          onClick={() => {
                            setSelectedMedicine(med);
                            setAddQuery(med.name);
                            setShowMedicineSearch(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                        >
                          <p className="text-sm font-medium text-foreground">{med.name}</p>
                          {med.genericName && (
                            <p className="text-xs text-muted-foreground">{med.genericName} · {med.category}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMedicine && (
                  <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                    <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      {selectedMedicine.name}
                      {selectedMedicine.genericName && ` (${selectedMedicine.genericName})`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Initial Stock"
                    type="number"
                    value={addStock}
                    onChange={(e) => setAddStock(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                  <Input
                    label="Price ($)"
                    type="number"
                    value={addPrice}
                    onChange={(e) => setAddPrice(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                  />
                  <Input
                    label="Minimum Stock"
                    type="number"
                    value={addMinStock}
                    onChange={(e) => setAddMinStock(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAdd} isLoading={isAdding} disabled={!selectedMedicine}>
                    Add to Inventory
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search medicines..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
        />
      </div>

      {/* Content */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
              title="Couldn't load inventory"
              description="Something went wrong."
              action={<Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>}
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="No medicines in inventory"
              description="Add your first medicine to get started."
              action={<Button onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4" /> Add Medicine</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{item.medicine.name}</h3>
                          {item.medicine.genericName && (
                            <span className="text-sm text-muted-foreground">({item.medicine.genericName})</span>
                          )}
                          {item.isLowStock && (
                            <Badge variant="warning" size="sm">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Low Stock
                            </Badge>
                          )}
                          {!item.inStock && (
                            <Badge variant="error" size="sm">Out of Stock</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.medicine.category}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-foreground font-medium">
                            Stock: {item.stock}
                            {item.minimumStock > 0 && (
                              <span className="text-muted-foreground"> (min: {item.minimumStock})</span>
                            )}
                          </span>
                          <span className="text-foreground font-medium">${item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Adjust Stock Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingId(adjustingId === item.id ? null : item.id)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemove(item.id)}
                          isLoading={isRemoving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Adjust Stock Form */}
                    <AnimatePresence>
                      {adjustingId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                            <h4 className="text-sm font-medium text-foreground">Adjust Stock</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="w-full">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
                                <select
                                  value={adjustType}
                                  onChange={(e) => setAdjustType(e.target.value as typeof adjustType)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                >
                                  <option value="PURCHASE">Purchase (Add)</option>
                                  <option value="RETURN">Return (Add)</option>
                                  <option value="ADJUSTMENT">Set Exact Amount</option>
                                </select>
                              </div>
                              <Input
                                label={adjustType === "ADJUSTMENT" ? "New Stock Level" : "Quantity"}
                                type="number"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                min={0}
                              />
                              <div className="flex items-end">
                                <Button
                                  onClick={() => handleAdjust(item.id)}
                                  isLoading={isAdjusting}
                                  disabled={adjustQty <= 0}
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
    </div>
  );
}
