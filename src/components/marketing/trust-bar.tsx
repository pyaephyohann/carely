"use client";

import { motion } from "framer-motion";
import { Shield, Lock, CalendarCheck, HeartPulse } from "lucide-react";

const trustItems = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Verified Professionals",
    description:
      "Every doctor on Carely is verified with valid credentials and medical licenses.",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Secure & Private",
    description:
      "Your health data is protected with industry-standard encryption and privacy practices.",
  },
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Instant Booking",
    description:
      "Book appointments in real-time with live availability — no phone calls needed.",
  },
  {
    icon: <HeartPulse className="h-6 w-6" />,
    title: "Continuity of Care",
    description:
      "Your prescriptions, records, and visit history are always accessible in one place.",
  },
];

export function TrustBar() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Built on trust
          </h2>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
            We take the responsibility of connecting patients with healthcare
            providers seriously.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl mb-5">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
