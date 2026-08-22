import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Hero,
  TrustBar,
  Specializations,
  HowItWorks,
  FeaturedDoctors,
  PharmacySection,
  CTASection,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Carely — Healthcare Appointments & Pharmacy Platform",
  description:
    "Find trusted doctors, book appointments instantly, manage prescriptions, and access quality healthcare. Carely connects patients with verified doctors and pharmacies.",
  openGraph: {
    title: "Carely — Healthcare Appointments & Pharmacy Platform",
    description:
      "Find trusted doctors, book appointments instantly, and manage your healthcare in one place.",
    type: "website",
    siteName: "Carely",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <Specializations />
        <HowItWorks />
        <FeaturedDoctors />
        <PharmacySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
