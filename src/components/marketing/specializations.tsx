"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Smile,
  Stethoscope,
  Activity,
} from "lucide-react";
import type { ReactNode } from "react";

interface SpecializationCard {
  name: string;
  icon: ReactNode;
  slug: string;
  description: string;
}

const specializations: SpecializationCard[] = [
  {
    name: "General Practice",
    icon: <Stethoscope className="h-6 w-6" />,
    slug: "general-practice",
    description: "Primary care and wellness checkups",
  },
  {
    name: "Cardiology",
    icon: <Heart className="h-6 w-6" />,
    slug: "cardiology",
    description: "Heart and cardiovascular health",
  },
  {
    name: "Dermatology",
    icon: <Smile className="h-6 w-6" />,
    slug: "dermatology",
    description: "Skin, hair, and nail conditions",
  },
  {
    name: "Pediatrics",
    icon: <Baby className="h-6 w-6" />,
    slug: "pediatrics",
    description: "Infant, child, and adolescent care",
  },
  {
    name: "Neurology",
    icon: <Brain className="h-6 w-6" />,
    slug: "neurology",
    description: "Brain and nervous system disorders",
  },
  {
    name: "Orthopedics",
    icon: <Bone className="h-6 w-6" />,
    slug: "orthopedics",
    description: "Bone, joint, and muscle conditions",
  },
  {
    name: "Ophthalmology",
    icon: <Eye className="h-6 w-6" />,
    slug: "ophthalmology",
    description: "Eye care and vision health",
  },
  {
    name: "Psychiatry",
    icon: <Activity className="h-6 w-6" />,
    slug: "psychiatry",
    description: "Mental health and wellness",
  },
];

export function Specializations() {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Find the right specialist
          </h2>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
            Browse doctors by specialty to find the care you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {specializations.map((spec, index) => (
            <motion.div
              key={spec.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={`/patient/doctors?specialization=${spec.slug}`}
                className="group block bg-white rounded-xl border border-zinc-200 p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                  {spec.icon}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1 group-hover:text-violet-600 transition-colors">
                  {spec.name}
                </h3>
                <p className="text-sm text-zinc-500">{spec.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
