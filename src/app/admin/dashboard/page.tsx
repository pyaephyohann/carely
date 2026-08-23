"use client";

import { Users, Stethoscope, Building2, Calendar, Pill, FileText, AlertCircle, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminDashboardQuery } from "@/store/api/adminApi";
import Link from "next/link";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  INACTIVE: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const roleColors: Record<string, string> = {
  PATIENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DOCTOR: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PHARMACY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Failed to load dashboard</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">Unable to fetch platform metrics.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  const { metrics, recentUsers, pendingVerifications } = data.data;

  const statCards = [
    { title: "Total Patients", value: metrics.totalPatients, icon: Users, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Total Doctors", value: metrics.totalDoctors, icon: Stethoscope, color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
    { title: "Total Pharmacies", value: metrics.totalPharmacies, icon: Building2, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { title: "Appointments Today", value: metrics.todayAppointments, icon: Calendar, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    { title: "Pending Appointments", value: metrics.pendingAppointments, icon: Clock, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
    { title: "Active Prescriptions", value: metrics.activePrescriptions, icon: Pill, color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" },
    { title: "Pending Fulfillments", value: metrics.pendingFulfillments, icon: FileText, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
    { title: "Completed Fulfillments", value: metrics.completedFulfillments, icon: CheckCircle, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Platform overview and management.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Verifications + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Doctor Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Pending Verifications</h2>
            <Link
              href="/admin/doctors?verified=false"
              className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {pendingVerifications.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">All doctors are verified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Dr. {doc.firstName} {doc.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {doc.specialization || "No specialization"} · License: {doc.licenseNumber}
                      </p>
                    </div>
                    <Link
                      href={`/admin/doctors/${doc.id}`}
                      className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Users</h2>
            <Link
              href="/admin/users"
              className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                <p className="text-sm">No users yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || "bg-zinc-100 text-zinc-600"}`}>
                        {user.role}
                      </span>
                      <span className="text-xs text-zinc-400">{formatTimeAgo(user.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
