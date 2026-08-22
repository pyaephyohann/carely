"use client";

import Link from "next/link";
import { Star, BadgeCheck, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";
import type { DoctorListItem } from "@/store/api/doctorApi";
import { DAYS_OF_WEEK } from "@/lib/constants";

interface DoctorCardProps {
  doctor: DoctorListItem;
  className?: string;
}

export function DoctorCard({ doctor, className }: DoctorCardProps) {
  const dayLabels = DAYS_OF_WEEK.map((d) => d.label);
  const availableDays = new Set(doctor.scheduleSummary.map((s) => s.dayOfWeek));

  return (
    <Link href={`/patient/doctors/${doctor.id}`}>
      <Card
        className={cn(
          "group p-5 transition-all duration-200 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 cursor-pointer h-full",
          className,
        )}
      >
        <div className="flex gap-4">
          <Avatar
            firstName={doctor.firstName}
            lastName={doctor.lastName}
            src={doctor.avatar}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                {doctor.specialization && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {doctor.specialization.name}
                  </p>
                )}
              </div>
              {doctor.verified && (
                <Badge variant="success" size="sm">
                  <BadgeCheck className="h-3 w-3 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {doctor.rating !== null && doctor.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    ({doctor.totalReviews})
                  </span>
                </span>
              )}
              {doctor.yearsExperience != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {doctor.yearsExperience}yr exp
                </span>
              )}
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                ${doctor.consultationFee}
              </span>
            </div>

            {/* Availability Preview */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {dayLabels.map((label, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    availableDays.has(idx)
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                  )}
                >
                  {label.slice(0, 3)}
                </span>
              ))}
            </div>

            {/* Bio preview */}
            {doctor.bio && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 line-clamp-2">
                {doctor.bio}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
