"use client";

import { useState } from "react";
import { Calendar, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAdminAppointmentsQuery } from "@/store/api/adminApi";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useGetAdminAppointmentsQuery({
    status: statusFilter || undefined,
    page,
    limit,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Appointments</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Platform appointment oversight.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Failed to load appointments.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && !error && data?.data && (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <div className="col-span-3">Date & Time</div>
              <div className="col-span-2">Patient</div>
              <div className="col-span-3">Doctor</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Info</div>
            </div>

            {data.data.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                <p className="text-sm">No appointments found.</p>
              </div>
            ) : (
              data.data.map((apt) => (
                <div key={apt.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  {/* Date & Time */}
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {new Date(apt.startTime).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(apt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {/* Patient */}
                  <div className="md:col-span-2">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{apt.patient.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{apt.patient.email}</p>
                  </div>
                  {/* Doctor */}
                  <div className="md:col-span-3">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">Dr. {apt.doctor.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{apt.doctor.specialization || "General"}</p>
                  </div>
                  {/* Status */}
                  <div className="md:col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[apt.status] || ""}`}>
                      {apt.status.replace("_", " ")}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    {apt.hasConsultation && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <FileText className="h-3.5 w-3.5" /> Consulted
                      </span>
                    )}
                    {apt.reason && (
                      <span className="text-xs text-zinc-400 truncate max-w-[100px]" title={apt.reason}>
                        {apt.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.meta.total)} of {data.meta.total} appointments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page === data.meta.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
