"use client";

import { motion } from "framer-motion";
import { Stethoscope, FileText, Pill, ArrowRight } from "lucide-react";

const flowSteps = [
  {
    icon: <Stethoscope className="h-6 w-6" />,
    label: "Doctor",
    description: "See your doctor",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    label: "Prescription",
    description: "Receive prescription",
  },
  {
    icon: <Pill className="h-6 w-6" />,
    label: "Pharmacy",
    description: "Get your medication",
  },
];

export function PharmacySection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200/50 mb-6">
              <Pill className="h-3.5 w-3.5" />
              Coming Soon
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight leading-tight">
              Your care doesn&apos;t stop{" "}
              <span className="text-violet-600">after the appointment</span>
            </h2>
            <p className="mt-5 text-lg text-zinc-600 leading-relaxed">
              Find pharmacies near you, check medicine availability, and manage
              your prescriptions — all within Carely. Your doctor sends the
              prescription, and you pick up your medication.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Browse nearby pharmacies with real-time stock info",
                "Compare medicine prices across pharmacies",
                "Get notified when your prescription is ready",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0" />
                  <span className="text-zinc-600">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual — Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            {flowSteps.map((step, index) => (
              <div key={step.label} className="w-full max-w-sm">
                <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{step.label}</p>
                    <p className="text-sm text-zinc-500">{step.description}</p>
                  </div>
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-3">
                    <ArrowRight className="h-5 w-5 text-zinc-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
