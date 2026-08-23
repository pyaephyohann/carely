"use client";

import Link from "next/link";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import {
  useGetMyInventoryQuery,
  useGetPharmacyFulfillmentsQuery,
} from "@/store/api/pharmacyApi";

// =============================================================================
// Status Helpers
// =============================================================================

function getStatusVariant(status: string) {
  const map: Record<string, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
    PENDING: "warning",
    ACCEPTED: "info",
    PREPARING: "primary",
    READY: "success",
    COMPLETED: "success",
    REJECTED: "error",
    CANCELLED: "error",
  };
  return map[status] || "default";
}

// =============================================================================
// Component
// =============================================================================

export default function PharmacyDashboard() {
  const { data: inventoryData, isLoading: isLoadingInventory } = useGetMyInventoryQuery({
    limit: 100,
  });

  const { data: fulfillmentsData, isLoading: isLoadingFulfillments } =
    useGetPharmacyFulfillmentsQuery({ limit: 10 });

  const inventory = inventoryData?.data || [];
  const fulfillments = fulfillmentsData?.data || [];

  // Compute stats
  const totalMedicines = inventory.length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const pendingFulfillments = fulfillments.filter((f) => f.status === "PENDING").length;
  const completedToday = fulfillments.filter((f) => {
    if (f.status !== "COMPLETED") return false;
    const today = new Date().toISOString().split("T")[0];
    return f.updatedAt.startsWith(today);
  }).length;

  const stats = [
    {
      icon: Package,
      label: "Total Medicines",
      value: totalMedicines,
      color: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    },
    {
      icon: AlertTriangle,
      label: "Low Stock",
      value: lowStockCount,
      color: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
    },
    {
      icon: ShoppingCart,
      label: "Pending Orders",
      value: pendingFulfillments,
      color: "bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400",
    },
    {
      icon: CheckCircle,
      label: "Fulfilled Today",
      value: completedToday,
      color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your pharmacy operations</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingInventory || isLoadingFulfillments ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/pharmacy/inventory">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Manage Inventory</h3>
                  <p className="text-sm text-muted-foreground">Add, update, or adjust stock levels</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/pharmacy/prescriptions">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Prescription Queue</h3>
                  <p className="text-sm text-muted-foreground">View and process incoming prescriptions</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      {/* Recent Fulfillments */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
              {fulfillments.length > 0 && (
                <Link
                  href="/pharmacy/prescriptions"
                  className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  View all
                </Link>
              )}
            </div>

            {isLoadingFulfillments ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fulfillments.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-8 w-8" />}
                title="No orders yet"
                description="Prescription fulfillment requests will appear here."
              />
            ) : (
              <div className="space-y-3">
                {fulfillments.slice(0, 5).map((f) => (
                  <Link key={f.id} href={`/pharmacy/prescriptions/${f.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer border border-transparent hover:border-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {f.patient?.name || "Unknown Patient"}
                          </p>
                          <Badge variant={getStatusVariant(f.status)} size="sm">
                            {f.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {f.prescription?.diagnosis} &middot; {f.itemCount} medicines
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {new Date(f.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
