"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const demoDoctors = [
  { id: "demo-1", firstName: "Sarah", lastName: "Johnson", specialization: "Cardiology", rating: 4.9, totalReviews: 127, consultationFee: 150, yearsExperience: 12, available: true },
  { id: "demo-2", firstName: "Michael", lastName: "Chen", specialization: "Dermatology", rating: 4.8, totalReviews: 93, consultationFee: 120, yearsExperience: 8, available: true },
  { id: "demo-3", firstName: "Emily", lastName: "Rodriguez", specialization: "Pediatrics", rating: 4.9, totalReviews: 215, consultationFee: 100, yearsExperience: 15, available: false },
  { id: "demo-4", firstName: "James", lastName: "Williams", specialization: "Orthopedics", rating: 4.7, totalReviews: 68, consultationFee: 175, yearsExperience: 10, available: true },
];

export function FeaturedDoctors() {
  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Featured doctors
            </h2>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              Highly rated professionals ready to help you.
            </p>
          </div>
          <Link href="/patient/doctors" className="shrink-0">
            <Button variant="outline" size="md">
              View all doctors
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoDoctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                href="/patient/doctors"
                className="group block bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Avatar firstName={doctor.firstName} lastName={doctor.lastName} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {doctor.specialization}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{doctor.rating}</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">({doctor.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    {doctor.yearsExperience}y exp
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    ${doctor.consultationFee}
                  </span>
                  {doctor.available ? (
                    <Badge variant="success" size="sm">Available</Badge>
                  ) : (
                    <Badge variant="default" size="sm">Next week</Badge>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
