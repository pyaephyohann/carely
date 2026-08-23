"use client";

import { use } from "react";
import { AlertCircle, RefreshCw, ArrowLeft, ShieldCheck, ShieldOff, Mail, Phone, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminUserQuery, useUpdateUserStatusMutation } from "@/store/api/adminApi";
import Link from "next/link";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  INACTIVE: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { data, isLoading, error, refetch } = useGetAdminUserQuery(userId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">User not found</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">Unable to load user details.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const user = data.data;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ userId: user.id, status: newStatus }).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{user.name || user.email}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || ""}`}>
              {user.status.replace("_", " ")}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{user.role.toLowerCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.status === "ACTIVE" ? (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("SUSPENDED")}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <ShieldOff className="h-4 w-4 mr-2" /> Suspend
            </Button>
          ) : (
            <Button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={isUpdating}
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Account Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Joined</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Last Login</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      {user.profile && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user.role} Profile
            </h2>
          </CardHeader>
          <CardContent>
            {user.patient && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {(user.patient as Record<string, string>).firstName} {(user.patient as Record<string, string>).lastName}
                    </p>
                  </div>
                  {(user.patient as Record<string, string>).phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {(user.patient as Record<string, string>).phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {user.doctor && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Dr. {(user.doctor as Record<string, string>).firstName} {(user.doctor as Record<string, string>).lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">License</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {(user.doctor as Record<string, string>).licenseNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
