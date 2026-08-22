"use client";

import { motion } from "framer-motion";
import { Search, Calendar, MessageCircle, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Find a doctor",
    description:
      "Search by specialty, location, or condition to find the right healthcare provider.",
    icon: <Search className="h-6 w-6" />,
  },
  {
    number: "02",
    title: "Choose a time",
    description:
      "View real-time availability and pick a slot that fits your schedule.",
    icon: <Calendar className="h-6 w-6" />,
  },
  {
    number: "03",
    title: "Book your visit",
    description:
      "Confirm your appointment instantly. No phone calls, no waiting.",
    icon: <MessageCircle className="h-6 w-6" />,
  },
  {
    number: "04",
    title: "Get care",
    description:
      "Meet your doctor, receive your prescription, and access your records online.",
    icon: <CheckCircle className="h-6 w-6" />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            How Carely works
          </h2>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
            Getting the care you need is simple. Here&apos;s how it works.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line (hidden on mobile, visible on lg) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px bg-zinc-200" />
              )}

              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-zinc-50 border border-zinc-200 rounded-2xl mb-5">
                  <span className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.number}
                  </span>
                  <div className="text-zinc-700">{step.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
