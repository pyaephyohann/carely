"use client";

import { useState, useMemo } from "react";
import { Calendar, Plus, Trash2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDoctorScheduleQuery,
  useUpdateDoctorScheduleMutation,
  useGetDoctorAvailabilityExceptionsQuery,
  useCreateAvailabilityExceptionMutation,
  useDeleteAvailabilityExceptionMutation,
} from "@/store/api/appointmentApi";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/utils/cn";

const DAY_LABELS = DAYS_OF_WEEK.map((d) => d.label);

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

function buildDefaultSchedule(): ScheduleEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "17:00",
    active: false,
  }));
}

export default function DoctorSchedulePage() {
  const { data: scheduleData, isLoading: isLoadingSchedule } = useGetDoctorScheduleQuery();
  const [updateSchedule, { isLoading: isSaving }] = useUpdateDoctorScheduleMutation();

  const { data: exceptionsData, isLoading: isLoadingExceptions } = useGetDoctorAvailabilityExceptionsQuery({});
  const [createException, { isLoading: isCreatingException }] = useCreateAvailabilityExceptionMutation();
  const [deleteException, { isLoading: isDeleting }] = useDeleteAvailabilityExceptionMutation();

  // Build schedule from API data, with local edits tracked separately
  const serverSchedule = useMemo<ScheduleEntry[]>(
    () =>
      scheduleData?.data
        ? scheduleData.data.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            active: s.active,
          }))
        : buildDefaultSchedule(),
    [scheduleData],
  );

  const [localEdits, setLocalEdits] = useState<Record<number, Partial<ScheduleEntry>>>({});
  const [saved, setSaved] = useState(false);

  // Merge server data with local edits
  const schedule = useMemo(
    () =>
      serverSchedule.map((s) => ({
        ...s,
        ...(localEdits[s.dayOfWeek] || {}),
      })),
    [serverSchedule, localEdits],
  );

  // New exception form
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionAvailable, setNewExceptionAvailable] = useState(false);
  const [newExceptionStartTime, setNewExceptionStartTime] = useState("09:00");
  const [newExceptionEndTime, setNewExceptionEndTime] = useState("17:00");
  const [newExceptionReason, setNewExceptionReason] = useState("");

  const exceptions = useMemo(() => exceptionsData?.data || [], [exceptionsData]);

  const handleScheduleChange = (dayOfWeek: number, field: keyof ScheduleEntry, value: string | boolean) => {
    setLocalEdits((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...(prev[dayOfWeek] || {}),
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleSaveSchedule = async () => {
    try {
      await updateSchedule({ schedules: schedule }).unwrap();
      setLocalEdits({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleAddException = async () => {
    if (!newExceptionDate) return;
    try {
      await createException({
        date: newExceptionDate,
        available: newExceptionAvailable,
        startTime: newExceptionAvailable ? newExceptionStartTime : undefined,
        endTime: newExceptionAvailable ? newExceptionEndTime : undefined,
        reason: newExceptionReason || undefined,
      }).unwrap();
      setNewExceptionDate("");
      setNewExceptionAvailable(false);
      setNewExceptionReason("");
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await deleteException(id).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Schedule</h1>
        <p className="text-muted-foreground mt-1">Manage your working hours and availability exceptions</p>
      </motion.div>

      {/* Weekly Schedule */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Weekly Hours
              </h2>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Saved
                  </span>
                )}
                <Button onClick={handleSaveSchedule} isLoading={isSaving} size="sm">
                  Save Schedule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSchedule ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {DAY_LABELS.map((day, idx) => {
                  const daySchedule = schedule[idx];
                  return (
                    <div key={idx} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <div className="w-28 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={daySchedule.active}
                          onChange={(e) => handleScheduleChange(idx, "active", e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className={cn("text-sm font-medium", daySchedule.active ? "text-foreground" : "text-muted-foreground")}>
                          {day}
                        </span>
                      </div>
                      {daySchedule.active ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={daySchedule.startTime}
                            onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={daySchedule.endTime}
                            onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Day off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Availability Exceptions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-foreground">Availability Exceptions</h2>
            <p className="text-sm text-muted-foreground">Block specific dates or adjust hours for particular days</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Exception Form */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h3 className="text-sm font-medium text-foreground">Add Exception</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  label="Date"
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                />
                <div className="w-full">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Type</label>
                  <select
                    value={newExceptionAvailable ? "available" : "blocked"}
                    onChange={(e) => setNewExceptionAvailable(e.target.value === "available")}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="blocked">Full Day Off</option>
                    <option value="available">Custom Hours</option>
                  </select>
                </div>
                {newExceptionAvailable && (
                  <>
                    <Input label="Start Time" type="time" value={newExceptionStartTime} onChange={(e) => setNewExceptionStartTime(e.target.value)} />
                    <Input label="End Time" type="time" value={newExceptionEndTime} onChange={(e) => setNewExceptionEndTime(e.target.value)} />
                  </>
                )}
              </div>
              <Input
                label="Reason (optional)"
                value={newExceptionReason}
                onChange={(e) => setNewExceptionReason(e.target.value)}
                placeholder="Vacation, Conference, etc."
              />
              <Button onClick={handleAddException} isLoading={isCreatingException} size="sm" disabled={!newExceptionDate}>
                <Plus className="h-4 w-4" />
                Add Exception
              </Button>
            </div>

            {/* Existing Exceptions */}
            {isLoadingExceptions ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : exceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No exceptions configured</p>
            ) : (
              <div className="space-y-2">
                {exceptions.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", ex.available ? "bg-emerald-500" : "bg-red-500")} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(ex.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ex.available
                            ? `Available ${ex.startTime} — ${ex.endTime}`
                            : "Full day off"}
                          {ex.reason && ` • ${ex.reason}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteException(ex.id)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-red-600 transition-colors"
                      disabled={isDeleting}
                      aria-label="Delete exception"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
