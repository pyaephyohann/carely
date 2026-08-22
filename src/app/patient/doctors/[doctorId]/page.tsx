"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/features/patient/empty-state";
import { useGetDoctorByIdQuery } from "@/store/api/doctorApi";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/utils/cn";

const DAY_LABELS = DAYS_OF_WEEK.map((d) => d.label);

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function DoctorProfilePage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const { data, isLoading, error } = useGetDoctorByIdQuery(doctorId);
  const doctor = data?.data;

  // Loading state
  if (isLoading) {
    return <DoctorProfileSkeleton />;
  }

  // Error state
  if (error || !doctor) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          title="Doctor not found"
          description="The doctor profile you're looking for doesn't exist or is no longer available."
          action={
            <Link href="/patient/doctors">
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Browse Doctors
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href="/patient/doctors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>
      </motion.div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar
                firstName={doctor.firstName}
                lastName={doctor.lastName}
                src={doctor.avatar}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h1>
                  {doctor.verified && (
                    <Badge variant="success">
                      <BadgeCheck className="h-3.5 w-3.5 mr-0.5" />
                      Verified
                    </Badge>
                  )}
                </div>

                {doctor.specialization && (
                  <p className="text-lg text-muted-foreground mb-3">
                    {doctor.specialization.name}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {doctor.rating !== null && doctor.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-foreground">
                        {doctor.rating.toFixed(1)}
                      </span>
                      <span>({doctor.totalReviews} reviews)</span>
                    </span>
                  )}
                  {doctor.yearsExperience != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {doctor.yearsExperience} years experience
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-foreground">
                      ${doctor.consultationFee}
                    </span>
                    consultation
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Bio & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {doctor.bio && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-foreground">About</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {doctor.bio}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">
                  Patient Reviews
                </h2>
              </CardHeader>
              <CardContent>
                {doctor.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No reviews yet. Reviews will appear after completed appointments.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {doctor.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-foreground">
                            {review.patientName}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  i < review.rating
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-zinc-300 dark:text-zinc-600",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column — Availability & Booking */}
        <div className="space-y-6">
          {/* Availability Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Availability
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DAY_LABELS.map((day, idx) => {
                    const schedule = doctor.schedules.find(
                      (s) => s.dayOfWeek === idx,
                    );
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between py-2 px-3 rounded-lg text-sm",
                          schedule
                            ? "bg-emerald-50 dark:bg-emerald-950/30"
                            : "bg-zinc-50 dark:bg-zinc-800/50",
                        )}
                      >
                        <span className="font-medium text-foreground">{day}</span>
                        {schedule ? (
                          <span className="text-emerald-700 dark:text-emerald-300">
                            {formatTime(schedule.startTime)} — {formatTime(schedule.endTime)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Consultation Fee & Book Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Consultation Fee</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${doctor.consultationFee}
                  </p>
                </div>
                <Button className="w-full" size="lg" disabled>
                  <Stethoscope className="h-5 w-5" />
                  Book Appointment
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Appointment booking coming soon
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Professional Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Details</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {doctor.specialization && (
                  <div className="flex items-center gap-3 text-sm">
                    <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Specialization</p>
                      <p className="font-medium text-foreground">{doctor.specialization.name}</p>
                    </div>
                  </div>
                )}
                {doctor.yearsExperience != null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium text-foreground">
                        {doctor.yearsExperience} years
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground">In-Person Consultation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function DoctorProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-4 w-32" />
      <Card>
        <CardContent className="p-8">
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
